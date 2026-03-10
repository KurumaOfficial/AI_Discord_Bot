// Authors: Kuruma, Letifer

import { ALLOWED_MODES } from '../config/constants.js';

export class GuildSettingsService {
  constructor({ store, config }) {
    this.store = store;
    this.config = config;
  }

  getSettings(guildId) {
    return this.store.getGuildState(guildId).settings;
  }

  async setMode(guildId, mode) {
    if (!ALLOWED_MODES.includes(mode)) {
      throw new Error(`Unsupported mode: ${mode}`);
    }

    await this.store.updateGuildState(guildId, async (guildState) => {
      guildState.settings.mode = mode;
    });
  }

  async setPrefix(guildId, prefix) {
    await this.store.updateGuildState(guildId, async (guildState) => {
      guildState.settings.prefix = prefix;
    });
  }
}
