// Authors: Kuruma, Letifer

import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_EXECUTION_DELAY_MS,
  DEFAULT_MAX_CONVERSATION_TURNS,
  DEFAULT_MAX_PENDING_PLANS,
  SAFE_DEFAULT_MODE
} from './constants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

function parseBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function loadConfig() {
  const config = {
    rootDir,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    discordToken: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    commandGuildId: process.env.COMMAND_GUILD_ID || '',
    prefixSymbol: process.env.PREFIX_SYMBOL || '!',
    defaultMode: process.env.DEFAULT_MODE || SAFE_DEFAULT_MODE,
    ownerIds: splitCsv(process.env.OWNER_IDS),
    aiProvider: process.env.AI_PROVIDER || 'none',
    allowDestructiveOperations: parseBoolean(process.env.ALLOW_DESTRUCTIVE_OPERATIONS, false),
    executionDelayMs: parseInteger(process.env.EXECUTION_DELAY_MS, DEFAULT_EXECUTION_DELAY_MS),
    maxConversationTurns: parseInteger(
      process.env.MAX_CONVERSATION_TURNS,
      DEFAULT_MAX_CONVERSATION_TURNS
    ),
    maxPendingPlans: parseInteger(process.env.MAX_PENDING_PLANS, DEFAULT_MAX_PENDING_PLANS),
    paths: {
      dataDir: path.join(rootDir, 'data'),
      logsDir: path.join(rootDir, 'logs'),
      storeFile: path.join(rootDir, 'data', 'store.json'),
      richPromptFile: path.join(rootDir, 'src', 'prompts', 'rich-system.txt'),
      bridgePromptFile: path.join(rootDir, 'src', 'prompts', 'bridge-master-prompt.txt')
    },
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      },
      grok: {
        apiKey: process.env.GROK_API_KEY || '',
        model: process.env.GROK_MODEL || 'grok-3-mini',
        baseUrl: process.env.GROK_BASE_URL || 'https://api.x.ai/v1'
      },
      claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'
      },
      openAiCompatible: {
        apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || '',
        model: process.env.OPENAI_COMPATIBLE_MODEL || '',
        baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || ''
      }
    }
  };

  return config;
}

export function validateRuntimeConfig(config) {
  const missing = [];

  if (!config.discordToken) {
    missing.push('DISCORD_TOKEN');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function validateDeployConfig(config) {
  const missing = [];

  if (!config.discordToken) {
    missing.push('DISCORD_TOKEN');
  }

  if (!config.clientId) {
    missing.push('CLIENT_ID');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for command deploy: ${missing.join(', ')}`);
  }
}
