// Authors: Kuruma, Letifer

export class ConversationService {
  constructor({ store, config }) {
    this.store = store;
    this.config = config;
  }

  async appendConversationTurn(guildId, entry) {
    await this.store.updateGuildState(guildId, async (guildState) => {
      guildState.conversation.push(entry);
      guildState.conversation = guildState.conversation.slice(-this.config.maxConversationTurns);
    });
  }

  async appendBridgeHistory(guildId, entry) {
    await this.store.updateGuildState(guildId, async (guildState) => {
      guildState.bridgeHistory.push(entry);
      guildState.bridgeHistory = guildState.bridgeHistory.slice(-this.config.maxConversationTurns);
    });
  }

  getConversation(guildId) {
    return this.store.getGuildState(guildId).conversation;
  }

  getBridgeHistory(guildId) {
    return this.store.getGuildState(guildId).bridgeHistory;
  }
}
