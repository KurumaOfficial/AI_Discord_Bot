// Authors: Kuruma, Letifer

import { OpenAICompatibleProvider } from './OpenAICompatibleProvider.js';

export class GrokProvider extends OpenAICompatibleProvider {
  constructor(options) {
    super({
      name: 'grok',
      ...options
    });
  }
}
