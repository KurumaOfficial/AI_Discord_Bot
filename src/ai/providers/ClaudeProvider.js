// Authors: Kuruma, Letifer

import { BaseAIProvider } from './BaseAIProvider.js';

export class ClaudeProvider extends BaseAIProvider {
  async requestJson({ systemPrompt, userPrompt, temperature = 0.2 }) {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${this.name} request failed with ${response.status}: ${body}`);
    }

    const payload = await response.json();
    const content = payload?.content?.find((entry) => entry.type === 'text')?.text;

    if (!content) {
      throw new Error(`${this.name} returned an empty message.`);
    }

    return content;
  }
}
