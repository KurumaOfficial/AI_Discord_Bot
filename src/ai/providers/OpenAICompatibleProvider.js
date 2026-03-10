// Authors: Kuruma, Letifer

import { BaseAIProvider } from './BaseAIProvider.js';

export class OpenAICompatibleProvider extends BaseAIProvider {
  constructor({ maxTokens = 0, fallbackModel = '', extraHeaders = {}, ...options }) {
    super(options);
    this.maxTokens = maxTokens;
    this.fallbackModel = fallbackModel;
    this.extraHeaders = extraHeaders;
  }

  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...this.extraHeaders
    };
  }

  buildRequestBody({ systemPrompt, userPrompt, temperature, model }) {
    const body = {
      model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    if (this.maxTokens > 0) {
      body.max_tokens = this.maxTokens;
    }

    return body;
  }

  extractContent(payload) {
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content === 'string' && content.trim()) {
      return content;
    }

    if (Array.isArray(content)) {
      const normalized = content
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry;
          }

          return entry?.text || '';
        })
        .join('\n')
        .trim();

      if (normalized) {
        return normalized;
      }
    }

    throw new Error(`${this.name} returned an empty completion.`);
  }

  formatFailure({ status, body, model }) {
    return `${this.name} request failed with ${status} for model ${model}: ${body}`;
  }

  async createCompletion({ systemPrompt, userPrompt, temperature, model }) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(
        this.buildRequestBody({
          systemPrompt,
          userPrompt,
          temperature,
          model
        })
      )
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body: await response.text(),
        model
      };
    }

    return {
      ok: true,
      payload: await response.json(),
      model
    };
  }

  async requestJson({ systemPrompt, userPrompt, temperature = 0.2 }) {
    this.ensureConfigured();

    const primaryAttempt = await this.createCompletion({
      systemPrompt,
      userPrompt,
      temperature,
      model: this.model
    });

    if (!primaryAttempt.ok) {
      if (primaryAttempt.status === 429 && this.fallbackModel) {
        this.logger?.warn?.('Primary AI model hit rate limit, retrying with fallback model.', {
          provider: this.name,
          model: this.model,
          fallbackModel: this.fallbackModel
        });

        const fallbackAttempt = await this.createCompletion({
          systemPrompt,
          userPrompt,
          temperature,
          model: this.fallbackModel
        });

        if (!fallbackAttempt.ok) {
          throw new Error(this.formatFailure(fallbackAttempt));
        }

        return this.extractContent(fallbackAttempt.payload);
      }

      throw new Error(this.formatFailure(primaryAttempt));
    }

    return this.extractContent(primaryAttempt.payload);
  }
}
