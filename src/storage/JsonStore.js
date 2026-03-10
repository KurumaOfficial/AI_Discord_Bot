// Authors: Kuruma, Letifer

import { PENDING_PLAN_TTL_MS } from '../config/constants.js';
import { readJsonSafe, writeJsonAtomic } from '../utils/fs.js';

function createInitialState() {
  return {
    version: 1,
    guilds: {}
  };
}

export class JsonStore {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.state = createInitialState();
  }

  async load() {
    this.state = await readJsonSafe(this.config.paths.storeFile, createInitialState());
    this.resetInProgressPlans();
    this.cleanupExpiredPlans();
    await this.save();
    return this.state;
  }

  async save() {
    await writeJsonAtomic(this.config.paths.storeFile, this.state);
  }

  getGuildState(guildId) {
    if (!this.state.guilds[guildId]) {
      this.state.guilds[guildId] = {
        settings: {
          mode: this.config.defaultMode,
          prefix: this.config.prefixSymbol,
          allowDestructiveOperations: this.config.allowDestructiveOperations
        },
        conversation: [],
        bridgeHistory: [],
        pendingPlans: {}
      };
    }

    return this.state.guilds[guildId];
  }

  async updateGuildState(guildId, updater) {
    const guildState = this.getGuildState(guildId);
    await updater(guildState);
    this.cleanupExpiredPlans(guildState);
    await this.save();
    return guildState;
  }

  cleanupExpiredPlans(guildState) {
    if (!guildState) {
      Object.values(this.state.guilds).forEach((entry) => this.cleanupExpiredPlans(entry));
      return;
    }

    const cutoff = Date.now() - PENDING_PLAN_TTL_MS;
    for (const [planId, pendingPlan] of Object.entries(guildState.pendingPlans)) {
      if ((pendingPlan.createdAt || 0) < cutoff) {
        delete guildState.pendingPlans[planId];
      }
    }
  }

  resetInProgressPlans() {
    for (const guildState of Object.values(this.state.guilds)) {
      for (const pendingPlan of Object.values(guildState.pendingPlans || {})) {
        if (pendingPlan.status === 'in_progress') {
          pendingPlan.status = 'pending';
          pendingPlan.lastError = pendingPlan.lastError || 'Recovered after process restart.';
          delete pendingPlan.startedAt;
        }
      }
    }
  }
}
