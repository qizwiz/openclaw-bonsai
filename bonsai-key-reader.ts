import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ALGORITHM = "aes-256-cbc";
const SCRYPT_PASSWORD = "bonsai-cli";
const SCRYPT_SALT = "salt";
const SCRYPT_KEY_LEN = 32;
const PBKDF2_ITERATIONS = 10_000;
const PBKDF2_KEY_LEN = 32;
const PBKDF2_DIGEST = "sha512";

function resolveConfigPath(): string {
  const platform = os.platform();
  const home = os.homedir();
  if (platform === "darwin") {
    return path.join(home, "Library", "Preferences", "bonsai-cli-nodejs", "config.json");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    return path.join(appData, "bonsai-cli-nodejs", "config.json");
  }
  // Linux / other: XDG_CONFIG_HOME or ~/.config
  const xdgConfig = process.env.XDG_CONFIG_HOME ?? path.join(home, ".config");
  return path.join(xdgConfig, "bonsai-cli-nodejs", "config.json");
}

function decrypt(raw: Buffer): string {
  const encryptionKey = crypto
    .scryptSync(SCRYPT_PASSWORD, SCRYPT_SALT, SCRYPT_KEY_LEN)
    .toString("hex")
    .slice(0, 32);

  const iv = raw.subarray(0, 16);
  const ciphertext = raw.subarray(17); // skip ":" separator at byte 16

  const aesKey = crypto.pbkdf2Sync(
    encryptionKey,
    iv.toString(),
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LEN,
    PBKDF2_DIGEST,
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, aesKey, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function readBonsaiKey(configPathOverride?: string): string | null {
  const configPath = configPathOverride ?? resolveConfigPath();
  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const raw = fs.readFileSync(configPath);
    if (raw.length < 18) {
      return null;
    }
    const json = decrypt(raw);
    const config = JSON.parse(json) as { apiKey?: string };
    const key = config.apiKey?.trim();
    if (!key) {
      return null;
    }
    return key;
  } catch {
    return null;
  }
}
