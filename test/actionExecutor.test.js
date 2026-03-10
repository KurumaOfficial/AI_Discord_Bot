// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { Collection } from 'discord.js';
import { ActionExecutor } from '../src/engine/ActionExecutor.js';

function createBaseGuild() {
  const moderatorRole = { id: '111111111111111111', name: 'Moderator' };
  const staffChannel = { id: '222222222222222222', name: 'staff-chat' };

  return {
    id: 'guild-1',
    roles: {
      cache: new Collection([[moderatorRole.id, moderatorRole]]),
      fetch: async () => new Collection([[moderatorRole.id, moderatorRole]])
    },
    channels: {
      cache: new Collection([[staffChannel.id, staffChannel]]),
      fetch: async () => new Collection([[staffChannel.id, staffChannel]])
    },
    emojis: {
      create: async (payload) => payload
    },
    autoModerationRules: {
      create: async (payload) => payload
    }
  };
}

test('ActionExecutor resolves named roles for emoji.create', async () => {
  const executor = new ActionExecutor({
    config: { allowDestructiveOperations: false, executionDelayMs: 0 },
    logger: { warn() {}, error() {} }
  });

  const guild = createBaseGuild();
  const result = await executor.handleEmojiCreate(guild, {
    name: 'kuruma',
    imageBase64: 'AA==',
    roles: ['Moderator']
  });

  assert.equal(result.roles.length, 1);
  assert.equal(result.roles[0].id, '111111111111111111');
});

test('ActionExecutor resolves named roles and channels for automod.create', async () => {
  const executor = new ActionExecutor({
    config: { allowDestructiveOperations: false, executionDelayMs: 0 },
    logger: { warn() {}, error() {} }
  });

  const guild = createBaseGuild();
  const result = await executor.handleAutoModCreate(guild, {
    name: 'Block spam',
    actions: [{ type: 1 }],
    exemptRoles: ['Moderator'],
    exemptChannels: ['staff-chat']
  });

  assert.equal(result.exemptRoles.length, 1);
  assert.equal(result.exemptRoles[0].id, '111111111111111111');
  assert.equal(result.exemptChannels.length, 1);
  assert.equal(result.exemptChannels[0].id, '222222222222222222');
});
