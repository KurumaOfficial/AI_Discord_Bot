// Authors: Kuruma, Letifer

import { GatewayIntentBits, Partials, PermissionFlagsBits } from 'discord.js';

export const APP_NAME = 'Kuruma Discord Bot';
export const PLAN_VERSION = '1.0';
export const STORE_FILENAME = 'store.json';
export const PENDING_PLAN_TTL_MS = 1000 * 60 * 60 * 6;
export const BRIDGE_HEADER = 'KURUMA_PLAN_V1';
export const DEFAULT_EXECUTION_DELAY_MS = 350;
export const DEFAULT_MAX_CONVERSATION_TURNS = 12;
export const DEFAULT_MAX_PENDING_PLANS = 10;

export const CLIENT_OPTIONS = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
};

export const SAFE_DEFAULT_MODE = 'bridge';

export const MODAL_CUSTOM_IDS = {
  BRIDGE_APPLY: 'bridge_apply_modal'
};

export const BUTTON_CUSTOM_IDS = {
  APPLY_PLAN: 'apply_plan',
  SHOW_PLAN: 'show_plan',
  CANCEL_PLAN: 'cancel_plan',
  OPEN_BRIDGE_MODAL: 'open_bridge_modal'
};

export const ALLOWED_MODES = ['rich', 'bridge'];

export const TEMPLATE_NAMES = [
  'gaming',
  'startup',
  'study',
  'fan-community',
  'creator',
  'support'
];

export const DESTRUCTIVE_ACTION_TYPES = new Set([
  'role.delete',
  'channel.delete',
  'overwrite.clear',
  'automod.delete',
  'emoji.delete',
  'sticker.delete',
  'event.delete'
]);

export const MANAGE_GUILD_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels
];
