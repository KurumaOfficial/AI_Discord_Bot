// Authors: Kuruma, Letifer

import crypto from 'node:crypto';

export class PendingPlanService {
  constructor({ store, config }) {
    this.store = store;
    this.config = config;
    this.activeExecutions = new Set();
  }

  async createPendingPlan(guildId, payload) {
    const planId = crypto.randomUUID();

    await this.store.updateGuildState(guildId, async (guildState) => {
      guildState.pendingPlans[planId] = {
        ...payload,
        createdAt: Date.now(),
        status: 'pending',
        attemptCount: 0
      };

      const entries = Object.entries(guildState.pendingPlans)
        .sort((left, right) => right[1].createdAt - left[1].createdAt)
        .slice(0, this.config.maxPendingPlans);

      guildState.pendingPlans = Object.fromEntries(entries);
    });

    return planId;
  }

  getPendingPlan(guildId, planId) {
    return this.store.getGuildState(guildId).pendingPlans[planId] || null;
  }

  async claimPendingPlan(guildId, planId) {
    const executionKey = `${guildId}:${planId}`;
    if (this.activeExecutions.has(executionKey)) {
      throw new Error('This plan is already being executed.');
    }

    this.activeExecutions.add(executionKey);

    try {
      let claimedPlan = null;

      await this.store.updateGuildState(guildId, async (guildState) => {
        const pendingPlan = guildState.pendingPlans[planId];
        if (!pendingPlan) {
          throw new Error('Pending plan not found or expired.');
        }

        pendingPlan.status = 'in_progress';
        pendingPlan.startedAt = Date.now();
        pendingPlan.attemptCount = (pendingPlan.attemptCount || 0) + 1;
        claimedPlan = { ...pendingPlan };
      });

      return claimedPlan;
    } catch (error) {
      this.activeExecutions.delete(executionKey);
      throw error;
    }
  }

  async releasePendingPlan(guildId, planId, { lastError = null } = {}) {
    const executionKey = `${guildId}:${planId}`;

    await this.store.updateGuildState(guildId, async (guildState) => {
      const pendingPlan = guildState.pendingPlans[planId];
      if (!pendingPlan) {
        return;
      }

      pendingPlan.status = 'pending';
      pendingPlan.lastFinishedAt = Date.now();
      pendingPlan.lastError = lastError;
      delete pendingPlan.startedAt;
    });

    this.activeExecutions.delete(executionKey);
  }

  async removePendingPlan(guildId, planId) {
    await this.store.updateGuildState(guildId, async (guildState) => {
      delete guildState.pendingPlans[planId];
    });

    this.activeExecutions.delete(`${guildId}:${planId}`);
  }
}
