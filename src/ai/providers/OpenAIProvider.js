// Authors: Kuruma, Letifer

import { OpenAICompatibleProvider } from './OpenAICompatibleProvider.js';

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(options) {
    super({
      name: 'openai',
      ...options
    });
  }
}
