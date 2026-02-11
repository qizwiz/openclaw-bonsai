import { describe, expect, it, vi } from "vitest";
import bonsaiPlugin from "./index.js";

describe("bonsaiPlugin", () => {
  it("has the correct plugin metadata", () => {
    expect(bonsaiPlugin.id).toBe("openclaw-bonsai");
    expect(bonsaiPlugin.name).toBe("Bonsai");
    expect(typeof bonsaiPlugin.description).toBe("string");
    expect(bonsaiPlugin.description.length).toBeGreaterThan(0);
  });

  it("has a register function", () => {
    expect(typeof bonsaiPlugin.register).toBe("function");
  });

  it("registers a bonsai provider via the plugin API", () => {
    const registered: unknown[] = [];
    const mockApi = {
      registerProvider: vi.fn((provider: unknown) => {
        registered.push(provider);
      }),
    };

    bonsaiPlugin.register(mockApi as never);

    expect(mockApi.registerProvider).toHaveBeenCalledTimes(1);
    const provider = registered[0] as {
      id: string;
      label: string;
      auth: Array<{ id: string; kind: string }>;
    };
    expect(provider.id).toBe("bonsai");
    expect(provider.label).toBe("Bonsai");
    expect(provider.auth).toHaveLength(1);
    expect(provider.auth[0].id).toBe("api-key");
    expect(provider.auth[0].kind).toBe("custom");
  });
});
