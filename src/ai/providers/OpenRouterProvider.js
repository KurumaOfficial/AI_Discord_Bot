// Authors: Kuruma, Letifer

import { OpenAICompatibleProvider } from './OpenAICompatibleProvider.js';

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor({ appTitle = '', httpReferer = '', ...options }) {
    const extraHeaders = {};

    if (httpReferer) {
      extraHeaders['HTTP-Referer'] = httpReferer;
    }

    if (appTitle) {
      extraHeaders['X-OpenRouter-Title'] = appTitle;
    }

    super({
      name: 'openrouter',
      extraHeaders,
      ...options
    });
  }

  buildRequestBody({ systemPrompt, userPrompt, temperature, model }) {
    return {
      ...super.buildRequestBody({
        systemPrompt,
        userPrompt,
        temperature,
        model
      }),
      response_format: {
        type: 'json_object'
      }
    };
  }
}
