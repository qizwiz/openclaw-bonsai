# openclaw-bonsai

OpenClaw provider plugin for [Bonsai](https://trybons.ai) — free access to frontier coding models.

## Install

```bash
openclaw plugins install openclaw-bonsai
```

Then run the auth setup:

```bash
openclaw onboard auth
# Select "Bonsai" from the provider list
```

## What it does

Registers Bonsai as a model provider in OpenClaw. Bonsai routes your requests to frontier models through `https://go.trybons.ai` using the Anthropic Messages API protocol.

Available models:

| Model | Context | Reasoning | Vision |
|-------|---------|-----------|--------|
| `bonsai/claude-sonnet-4-5` | 200k | Yes | Yes |
| `bonsai/claude-opus-4` | 200k | Yes | Yes |
| `bonsai/gpt-5.1-codex` | 200k | Yes | No |
| `bonsai/glm-4.6` | 128k | No | No |

All models are free in stealth mode. Prompts and completions are logged for benchmarking.

## Auto-detection

If you already have the [Bonsai CLI](https://www.npmjs.com/package/@bonsai-ai/cli) installed and logged in, the plugin will detect your existing API key automatically during setup.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- A Bonsai account — apply at [app.trybons.ai](https://app.trybons.ai)

## License

MIT
