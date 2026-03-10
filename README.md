# Kuruma Discord Bot

`Kuruma Discord Bot` is an AI-powered Discord server architect built with `Node.js + discord.js`.

Authors: `Kuruma`, `Letifer`.

The bot supports two working modes:

- `rich` - the bot talks to an AI API directly from Discord and builds a plan automatically
- `bridge` - the bot prepares a special package for a browser AI like ChatGPT, Grok, Claude, or any other model, then applies the returned `KURUMA_PLAN_V1` payload inside Discord

## Core capabilities

- natural-language server planning from slash commands or prefix messages
- JSON server snapshot export
- preview before apply
- bridge-package generation for free manual use
- reusable templates
- persistent pending plans
- wide Discord action execution layer

Supported action groups include:

- `guild.update`
- `role.create`, `role.update`, `role.delete`, `role.reposition`
- `channel.create`, `channel.update`, `channel.delete`, `channel.move`, `channel.clone`
- `overwrite.upsert`, `overwrite.clear`
- `member.update`, `member.role.add`, `member.role.remove`, `member.kick`, `member.ban`, `member.unban`
- `automod.create`, `automod.update`, `automod.delete`
- `emoji.create`, `emoji.update`, `emoji.delete`
- `sticker.create`, `sticker.update`, `sticker.delete`
- `event.create`, `event.update`, `event.delete`
- `message.send`

## Project structure

```text
Kuruma_Discord_Bot/
  src/
    ai/          # AI providers and interpreter layer
    config/      # env loading and runtime config
    discord/     # slash commands, prefix handler, UI
    engine/      # schema, templates, action executor
    prompts/     # rich and bridge prompts
    services/    # orchestration services
    storage/     # JSON persistence
    utils/       # logger and helpers
  data/
  logs/
  test/
```

## AI providers

The project currently supports:

- `openai`
- `grok`
- `claude`
- `openai-compatible`
- `openrouter`

### OpenRouter

OpenRouter is integrated as a first-class provider.

- base URL: `https://openrouter.ai/api/v1`
- endpoint: `/chat/completions`
- auth: `Authorization: Bearer <OPENROUTER_API_KEY>`
- required body fields: `model`, `messages`
- optional OpenRouter headers: `HTTP-Referer`, `X-OpenRouter-Title`

The bot also supports:

- free model example: `nvidia/nemotron-3-nano-30b-a3b:free`
- fallback model on `429`
- optional `max_tokens`
- JSON-oriented response format for cleaner structured plans

## Slash commands

- `/help`
- `/mode`
- `/setup`
- `/template`
- `/analyze_server`
- `/fix_permissions`
- `/export_state`
- `/bridge_apply`

## Prefix usage

Default prefix: `!`

Examples:

```text
! design a cleaner gaming community server
! analyze moderator permissions and fix role hierarchy
!template gaming
!mode bridge
!state
!apply <KURUMA_PLAN_V1 payload>
```

If a prefixed message is not a service command, the bot treats it as a normal AI request.

## Setup

### 1. Install

```powershell
cd C:\Users\gameg\Desktop\Holo_Project\Kuruma_Discord_Bot
npm install
```

### 2. Create `.env`

```powershell
Copy-Item .env.example .env
```

Minimum required values:

```env
DISCORD_TOKEN=
CLIENT_ID=
```

### 3. Configure Discord bot

Enable these intents in Discord Developer Portal:

- `SERVER MEMBERS INTENT`
- `MESSAGE CONTENT INTENT`

Recommended bot permissions:

- `Manage Guild`
- `Manage Channels`
- `Manage Roles`
- `Moderate Members`
- `Manage Emojis and Stickers`
- `Manage Events`
- `Send Messages`
- `Embed Links`
- `Attach Files`

For initial testing, `Administrator` is acceptable.

### 4. Deploy slash commands

```powershell
npm run deploy-commands
```

### 5. Start

```powershell
npm start
```

Development mode:

```powershell
npm run dev
```

## Example `.env` configurations

### Free bridge mode

```env
AI_PROVIDER=none
DEFAULT_MODE=bridge
PREFIX_SYMBOL=!
```

### OpenRouter rich mode

```env
AI_PROVIDER=openrouter
DEFAULT_MODE=rich
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=
OPENROUTER_APP_TITLE=Kuruma Discord Bot
OPENROUTER_MAX_TOKENS=2048
```

Important notes for OpenRouter:

- use the full model ID, for example `nvidia/nemotron-3-nano-30b-a3b:free`
- the bot sends Bearer auth in `Authorization`
- when the primary model returns `429`, the bot retries with `OPENROUTER_FALLBACK_MODEL` if configured

### Generic OpenAI-compatible mode

```env
AI_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_MODEL=
OPENAI_COMPATIBLE_BASE_URL=
```

## Main env variables

- `PREFIX_SYMBOL` - default prefix, for example `!`
- `DEFAULT_MODE` - `rich` or `bridge`
- `AI_PROVIDER` - `none | openai | grok | claude | openai-compatible | openrouter`
- `ALLOW_DESTRUCTIVE_OPERATIONS` - allows delete operations
- `EXECUTION_DELAY_MS` - delay between Discord API actions
- `MAX_CONVERSATION_TURNS` - conversation memory depth
- `MAX_PENDING_PLANS` - number of saved pending plans

## Safety

- destructive operations are disabled by default
- each plan is shown in preview before apply
- bridge payloads are validated before execution
- partially failed plans stay pending for retry
- duplicate apply attempts are blocked

## Tests

Run:

```powershell
npm test
```

## Credits

- idea and product direction: `Kuruma`
- implementation and architecture in this project: `Kuruma`, `Letifer`
