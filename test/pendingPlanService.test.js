// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { PendingPlanService } from '../src/services/PendingPlanService.js';

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

test('PendingPlanService prevents double claim while a plan is running', async () => {
  const store = createMemoryStore();
  const service = new PendingPlanService({
    store,
    config: { maxPendingPlans: 10 }
  });

  const planId = await service.createPendingPlan('guild-1', {
    plan: {
      version: '1.0',
      source: 'test',
      summary: 'Test',
      reasoning: '',
      warnings: [],
      actions: []
    }
  });

  const claimed = await service.claimPendingPlan('guild-1', planId);
  assert.equal(claimed.status, 'in_progress');

  await assert.rejects(
    async () => service.claimPendingPlan('guild-1', planId),
    /already being executed/
  );

  await service.releasePendingPlan('guild-1', planId);
  const pendingPlan = service.getPendingPlan('guild-1', planId);
  assert.equal(pendingPlan.status, 'pending');
});
