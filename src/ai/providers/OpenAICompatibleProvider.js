// Authors: Kuruma, Letifer

import { BaseAIProvider } from './BaseAIProvider.js';

export class OpenAICompatibleProvider extends BaseAIProvider {
  async requestJson({ systemPrompt, userPrompt, temperature = 0.2 }) {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${this.name} request failed with ${response.status}: ${body}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`${this.name} returned an empty completion.`);
    }

    return content;
  }
}
