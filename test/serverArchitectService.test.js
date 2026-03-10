// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { PendingPlanService } from '../src/services/PendingPlanService.js';
import { ServerArchitectService } from '../src/services/ServerArchitectService.js';

function createMemoryStore() {
  return {
    state: { guilds: {} },
    getGuildState(guildId) {
      if (!this.state.guilds[guildId]) {
        this.state.guilds[guildId] = {
          settings: {},
          conversation: [],
          bridgeHistory: [],
          pendingPlans: {}
        };
      }

      return this.state.guilds[guildId];
    },
    async updateGuildState(guildId, updater) {
      const guildState = this.getGuildState(guildId);
      await updater(guildState);
      return guildState;
    }
  };
}

test('ServerArchitectService keeps pending plan when execution has failures', async () => {
  const store = createMemoryStore();
  const pendingPlanService = new PendingPlanService({
    store,
    config: { maxPendingPlans: 10 }
  });

  const service = new ServerArchitectService({
    guildSettingsService: null,
    guildSnapshotService: null,
    conversationService: null,
    interpreterService: null,
    bridgePackageService: null,
    planValidator: null,
    pendingPlanService,
    actionExecutor: {
      async executePlan() {
        return [
          { type: 'channel.create', success: true },
          { type: 'overwrite.upsert', success: false, error: 'Missing role' }
        ];
      }
    },
    templateService: null,
    logger: { error() {}, warn() {}, info() {} }
  });

  const planId = await pendingPlanService.createPendingPlan('guild-1', {
    plan: {
      version: '1.0',
      source: 'test',
      summary: 'Test plan',
      reasoning: '',
      warnings: [],
      actions: [
        { type: 'channel.create', data: { name: 'general' } },
        { type: 'overwrite.upsert', data: { channel: 'general', targetName: 'Member' } }
      ]
    }
  });

  const result = await service.executePendingPlan({
    guild: { id: 'guild-1' },
    planId
  });

  assert.equal(result.keptPending, true);
  assert.ok(result.summary.includes('kept pending'));
  assert.ok(pendingPlanService.getPendingPlan('guild-1', planId));
});

test('ServerArchitectService removes pending plan after full success', async () => {
  const store = createMemoryStore();
  const pendingPlanService = new PendingPlanService({
    store,
    config: { maxPendingPlans: 10 }
  });

  const service = new ServerArchitectService({
    guildSettingsService: null,
    guildSnapshotService: null,
    conversationService: null,
    interpreterService: null,
    bridgePackageService: null,
    planValidator: null,
    pendingPlanService,
    actionExecutor: {
      async executePlan() {
        return [{ type: 'channel.create', success: true }];
      }
    },
    templateService: null,
    logger: { error() {}, warn() {}, info() {} }
  });

  const planId = await pendingPlanService.createPendingPlan('guild-1', {
    plan: {
      version: '1.0',
      source: 'test',
      summary: 'Test plan',
      reasoning: '',
      warnings: [],
      actions: [{ type: 'channel.create', data: { name: 'general' } }]
    }
  });

  const result = await service.executePendingPlan({
    guild: { id: 'guild-1' },
    planId
  });

  assert.equal(result.keptPending, false);
  assert.equal(pendingPlanService.getPendingPlan('guild-1', planId), null);
});

test('ServerArchitectService uses minimal snapshot options for casual chat', () => {
  const service = new ServerArchitectService({
    guildSettingsService: null,
    guildSnapshotService: null,
    conversationService: null,
    interpreterService: null,
    bridgePackageService: null,
    planValidator: null,
    pendingPlanService: null,
    actionExecutor: null,
    templateService: null,
    logger: { error() {}, warn() {}, info() {} }
  });

  const options = service.resolveSnapshotOptions({
    taskHint: 'general',
    userMessage: 'how is the weather?',
    mode: 'rich'
  });

  assert.equal(options.profile, 'minimal');
  assert.equal(options.includeMembers, false);
  assert.equal(options.memberLimit, 0);
});

test('ServerArchitectService uses analysis snapshot options for permission audits', () => {
  const service = new ServerArchitectService({
    guildSettingsService: null,
    guildSnapshotService: null,
    conversationService: null,
    interpreterService: null,
    bridgePackageService: null,
    planValidator: null,
    pendingPlanService: null,
    actionExecutor: null,
    templateService: null,
    logger: { error() {}, warn() {}, info() {} }
  });

  const options = service.resolveSnapshotOptions({
    taskHint: 'permissions',
    userMessage: 'please analyze moderator permissions and role hierarchy',
    mode: 'bridge'
  });

  assert.equal(options.includeMembers, true);
  assert.equal(options.includeAutoModerationRules, true);
  assert.equal(options.profile, 'analysis-bridge');
});
