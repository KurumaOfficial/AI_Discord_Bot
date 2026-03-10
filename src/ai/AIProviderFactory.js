// Authors: Kuruma, Letifer

import { ClaudeProvider } from './providers/ClaudeProvider.js';
import { GrokProvider } from './providers/GrokProvider.js';
import { OpenAICompatibleProvider } from './providers/OpenAICompatibleProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

export function createAIProvider(config, logger) {
  switch (config.aiProvider) {
    case 'openai':
      return new OpenAIProvider({
        logger,
        apiKey: config.providers.openai.apiKey,
        baseUrl: config.providers.openai.baseUrl,
        model: config.providers.openai.model
      });
    case 'grok':
      return new GrokProvider({
        logger,
        apiKey: config.providers.grok.apiKey,
        baseUrl: config.providers.grok.baseUrl,
        model: config.providers.grok.model
      });
    case 'claude':
      return new ClaudeProvider({
        logger,
        name: 'claude',
        apiKey: config.providers.claude.apiKey,
        baseUrl: config.providers.claude.baseUrl,
        model: config.providers.claude.model
      });
    case 'openai-compatible':
      return new OpenAICompatibleProvider({
        logger,
        name: 'openai-compatible',
        apiKey: config.providers.openAiCompatible.apiKey,
        baseUrl: config.providers.openAiCompatible.baseUrl,
        model: config.providers.openAiCompatible.model
      });
    default:
      return null;
  }
}
