import {
  emptyPluginConfigSchema,
  type OpenClawPluginApi,
  type ProviderAuthContext,
  type ProviderAuthResult,
} from "openclaw/plugin-sdk";
import { readBonsaiKey } from "./bonsai-key-reader.js";

const BONSAI_BASE_URL = "https://go.trybons.ai";

const BONSAI_DEFAULT_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

const BONSAI_MODELS = [
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5 (Bonsai)",
    reasoning: true,
    input: ["text", "image"] as Array<"text" | "image">,
    cost: BONSAI_DEFAULT_COST,
    contextWindow: 200_000,
    maxTokens: 64_000,
  },
  {
    id: "claude-opus-4",
    name: "Claude Opus 4 (Bonsai)",
    reasoning: true,
    input: ["text", "image"] as Array<"text" | "image">,
    cost: BONSAI_DEFAULT_COST,
    contextWindow: 200_000,
    maxTokens: 64_000,
  },
  {
    id: "gpt-5.1-codex",
    name: "GPT-5.1 Codex (Bonsai)",
    reasoning: true,
    input: ["text"] as Array<"text" | "image">,
    cost: BONSAI_DEFAULT_COST,
    contextWindow: 200_000,
    maxTokens: 32_000,
  },
  {
    id: "glm-4.6",
    name: "GLM-4.6 (Bonsai)",
    reasoning: false,
    input: ["text"] as Array<"text" | "image">,
    cost: BONSAI_DEFAULT_COST,
    contextWindow: 128_000,
    maxTokens: 8192,
  },
];

function validateApiKey(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "API key is required";
  }
  if (!trimmed.startsWith("sk_cr_")) {
    return "Bonsai API keys start with sk_cr_";
  }
  return undefined;
}

const bonsaiPlugin = {
  id: "openclaw-bonsai",
  name: "Bonsai",
  description: "Free access to frontier coding models via Bonsai (trybons.ai)",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: "bonsai",
      label: "Bonsai",
      docsPath: "/providers/models",
      auth: [
        {
          id: "api-key",
          label: "Bonsai API key",
          hint: "Enter your Bonsai API key (sk_cr_...) or auto-detect from Bonsai CLI",
          kind: "custom" as const,
          run: async (ctx: ProviderAuthContext): Promise<ProviderAuthResult> => {
            let apiKey: string;

            const existingKey = readBonsaiKey();
            if (existingKey) {
              const useExisting = await ctx.prompter.confirm({
                message: `Found Bonsai API key from CLI (${existingKey.slice(0, 8)}...). Use it?`,
              });
              if (useExisting) {
                apiKey = existingKey;
              } else {
                apiKey = await ctx.prompter.text({
                  message: "Bonsai API key",
                  validate: validateApiKey,
                });
              }
            } else {
              apiKey = await ctx.prompter.text({
                message: "Bonsai API key (get one at https://app.trybons.ai)",
                validate: validateApiKey,
              });
            }

            const defaultModelRef = "bonsai/claude-sonnet-4-5";

            return {
              profiles: [
                {
                  profileId: "bonsai:default",
                  credential: {
                    type: "api_key" as const,
                    provider: "bonsai",
                    key: apiKey,
                  },
                },
              ],
              configPatch: {
                models: {
                  providers: {
                    bonsai: {
                      baseUrl: BONSAI_BASE_URL,
                      apiKey,
                      api: "anthropic-messages" as const,
                      models: BONSAI_MODELS,
                    },
                  },
                },
              },
              defaultModel: defaultModelRef,
              notes: [
                "Bonsai routes to frontier models in stealth mode (model may vary).",
                "All models are free. Prompts/completions are logged for benchmarking.",
                "Get your API key at https://app.trybons.ai",
              ],
            };
          },
        },
      ],
    });
  },
};

export default bonsaiPlugin;
