import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readBonsaiKey } from "./bonsai-key-reader.js";

function createEncryptedConfig(config: Record<string, unknown>): Buffer {
  const encryptionKey = crypto
    .scryptSync("bonsai-cli", "salt", 32)
    .toString("hex")
    .slice(0, 32);

  const json = JSON.stringify(config);
  const iv = crypto.randomBytes(16);
  const aesKey = crypto.pbkdf2Sync(encryptionKey, iv.toString(), 10_000, 32, "sha512");
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(json, "utf8")), cipher.final()]);
  // Format: iv (16 bytes) + ":" (1 byte) + ciphertext
  return Buffer.concat([iv, Buffer.from(":"), encrypted]);
}

describe("readBonsaiKey", () => {
  const tmpFiles: string[] = [];

  function writeTmpConfig(data: Buffer): string {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bonsai-key-test-"));
    const tmpFile = path.join(tmpDir, "config.json");
    fs.writeFileSync(tmpFile, data);
    tmpFiles.push(tmpDir);
    return tmpFile;
  }

  afterEach(() => {
    for (const dir of tmpFiles) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpFiles.length = 0;
  });

  it("reads an API key from a valid encrypted config", () => {
    const encrypted = createEncryptedConfig({
      accessToken: "at_test",
      refreshToken: "rt_test",
      apiKey: "sk_cr_TestKey1234567890abcdef",
      apiKeyName: "test-key",
    });
    const tmpFile = writeTmpConfig(encrypted);
    const key = readBonsaiKey(tmpFile);
    expect(key).toBe("sk_cr_TestKey1234567890abcdef");
  });

  it("returns null when config file does not exist", () => {
    const key = readBonsaiKey("/tmp/nonexistent-bonsai-path/config.json");
    expect(key).toBeNull();
  });

  it("returns null when config file is too small", () => {
    const tmpFile = writeTmpConfig(Buffer.from("short"));
    const key = readBonsaiKey(tmpFile);
    expect(key).toBeNull();
  });

  it("returns null when config file is corrupted", () => {
    const tmpFile = writeTmpConfig(crypto.randomBytes(200));
    const key = readBonsaiKey(tmpFile);
    expect(key).toBeNull();
  });

  it("returns null when config has no apiKey field", () => {
    const encrypted = createEncryptedConfig({
      accessToken: "at_test",
      refreshToken: "rt_test",
    });
    const tmpFile = writeTmpConfig(encrypted);
    const key = readBonsaiKey(tmpFile);
    expect(key).toBeNull();
  });

  it("returns null when apiKey is empty string", () => {
    const encrypted = createEncryptedConfig({
      apiKey: "",
    });
    const tmpFile = writeTmpConfig(encrypted);
    const key = readBonsaiKey(tmpFile);
    expect(key).toBeNull();
  });
});
