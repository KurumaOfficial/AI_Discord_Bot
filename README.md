# Kuruma Discord Bot

`Kuruma Discord Bot` — это `AI Discord Server Architect` на `Node.js + discord.js`

Авторы: `Kuruma` и `Letifer`.

Бот умеет работать в двух режимах:

- `rich` — бот сам общается с AI API прямо из Discord.
- `bridge` — бот готовит специальный prompt-пакет для ChatGPT / Grok / Claude / любой браузерной модели, а потом применяет вручную вставленный ответ.

Проект сделан так, чтобы основной сценарий общения был прямо в Discord: через slash-команды и через обычные сообщения с префиксом, по умолчанию `!`.

## Что умеет бот

- понимать обычный текст вроде `! наведи порядок в ролях и правах доступа`
- собирать текущее состояние сервера в JSON snapshot
- строить AI-план изменений
- показывать preview плана перед применением
- применять изменения через Discord API
- поддерживать built-in шаблоны серверов
- экспортировать bridge-пакет для бесплатного ручного режима
- принимать bridge-ответ через modal или через `!apply`

## Поддерживаемые типы действий

Единый action engine умеет исполнять широкий набор операций:

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

Это не "весь Discord вслепую", а максимально широкий и расширяемый слой действий под серверное администрирование и архитектуру.

## Архитектура

```text
Kuruma_Discord_Bot/
  src/
    ai/          # провайдеры AI и interpreter
    config/      # env и runtime config
    discord/     # slash-команды, prefix handler, UI, permissions
    engine/      # schema, templates, action executor
    prompts/     # rich system prompt + bridge master prompt
    services/    # orchestration layer
    storage/     # JSON store
    utils/       # логгер, fs, text, parser helpers
  data/          # persistent store.json
  logs/          # combined.log / error.log
  test/          # базовые unit tests
```

## Режимы работы

### 1. Rich mode

Используется, когда есть API-ключ:

- OpenAI
- xAI / Grok
- Anthropic / Claude
- любой OpenAI-compatible API

Поток:

1. пользователь пишет в Discord
2. бот делает snapshot сервера
3. AI возвращает структурированный JSON
4. бот показывает preview
5. админ нажимает `Apply Plan`

### 2. Bridge mode

Используется, когда денег на API нет.

Поток:

1. пользователь пишет запрос в Discord
2. бот прикладывает `.txt` bridge package
3. пользователь копирует его в браузерный AI
4. внешний AI возвращает `KURUMA_PLAN_V1`
5. пользователь вставляет это в бот
6. бот валидирует план и предлагает применить

То есть пользователь выступает мостом между внешней моделью и Discord-ботом.

## Slash-команды

- `/help` — краткая справка
- `/mode` — переключить `rich` / `bridge`, при желании поменять префикс
- `/setup` — основной natural-language запрос на создание или перестройку сервера
- `/template` — встроенные шаблоны
- `/analyze_server` — анализ текущего сервера
- `/fix_permissions` — анализ и исправление прав доступа
- `/export_state` — выгрузка snapshot сервера
- `/bridge_apply` — открыть окно вставки bridge-ответа

## Prefix-команды

По умолчанию используется префикс `!`.

Примеры:

```text
! создай более профессиональную структуру сервера для игрового сообщества
! проанализируй этот сервер и предложи как навести порядок в правах
! как лучше организовать категории для стартап-комьюнити?
!template gaming
!mode bridge
!state
!apply <KURUMA_PLAN_V1 payload>
```

Если сообщение с префиксом не распознано как служебная команда, бот считает его обычным AI-запросом.

## Поведение AI

Бот не должен быть сухим инструментом.

Логика такая:

- на обычные человеческие вопросы он отвечает нормально
- но мягко тянет разговор обратно к Discord-архитектуре, ролям, каналам, permission flow, moderation и automation
- по стилю это ближе к `GitHub Copilot`, чем к бездушному JSON-генератору

## Быстрый старт

### 1. Установка

```bash
cd Kuruma_Discord_Bot
npm install
```

### 2. Discord Developer Portal

Включи у бота:

- `SERVER MEMBERS INTENT`
- `MESSAGE CONTENT INTENT`
- при необходимости дополнительные права для управления сервером

Боту на сервере нужны как минимум права уровня:

- `Manage Server`
- `Manage Channels`
- `Manage Roles`
- `Moderate Members`

Для части операций дополнительно понадобятся:

- `Manage Emojis and Stickers`
- `Manage Events`
- `Administrator` или эквивалентный набор прав

### 3. Настрой `.env`

Скопируй:

```bash
Copy-Item .env.example .env
```

Минимум нужно заполнить:

```env
DISCORD_TOKEN=
CLIENT_ID=
```

Если хочешь rich mode, добавь AI-провайдера и ключ:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Если API ключей нет:

```env
AI_PROVIDER=none
DEFAULT_MODE=bridge
```

### 4. Зарегистрируй slash-команды

```bash
npm run deploy-commands
```

Если в `.env` указан `COMMAND_GUILD_ID`, команды зарегистрируются только в тестовом сервере. Это удобно для быстрой отладки.

### 5. Запусти бота

```bash
npm start
```

Для разработки:

```bash
npm run dev
```

## Встроенные шаблоны

Поддерживаются:

- `gaming`
- `startup`
- `study`
- `fan-community`
- `creator`
- `support`

Пример:

```text
/template name:gaming
```

## Файлы конфигурации

Основные env-переменные:

- `PREFIX_SYMBOL` — префикс по умолчанию, например `!`
- `DEFAULT_MODE` — `rich` или `bridge`
- `AI_PROVIDER` — `none | openai | grok | claude | openai-compatible`
- `ALLOW_DESTRUCTIVE_OPERATIONS` — разрешить удаляющие действия
- `EXECUTION_DELAY_MS` — задержка между API-операциями
- `MAX_CONVERSATION_TURNS` — глубина памяти по серверу
- `MAX_PENDING_PLANS` — сколько pending-планов держать в хранилище

## Безопасность

- destructive operations по умолчанию выключены
- каждый план сначала идет в preview
- применение происходит только после подтверждения
- bridge payload проходит строгий парсинг
- persistent storage лежит локально в `data/store.json`

## Тесты

Запуск:

```bash
npm test
```

Сейчас покрыты базовые проверки:

- парсинг structured JSON
- bridge payload parser
- валидация плана
- template generation

## Важное ограничение

Проект уже покрывает широкий пласт Discord server management, но некоторые редкие или узкоспециализированные части Discord API могут потребовать добавления новых action handler'ов. Архитектура под это уже подготовлена.

## Кредиты

- Автор идеи и направление: `Kuruma`
- Реализация и архитектурное оформление в проекте: `Kuruma` и `Letifer`
