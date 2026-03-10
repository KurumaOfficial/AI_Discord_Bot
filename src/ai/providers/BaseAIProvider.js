// Authors: Kuruma, Letifer

export class BaseAIProvider {
  constructor({ name, baseUrl, model, apiKey, logger }) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.model = model;
    this.apiKey = apiKey;
    this.logger = logger;
  }

  ensureConfigured() {
    if (!this.apiKey) {
      throw new Error(`${this.name} provider is missing an API key.`);
    }

    if (!this.baseUrl) {
      throw new Error(`${this.name} provider is missing a base URL.`);
    }

    if (!this.model) {
      throw new Error(`${this.name} provider is missing a model name.`);
    }
  }

  async requestJson() {
    throw new Error('BaseAIProvider.requestJson must be implemented by subclasses.');
  }
}
