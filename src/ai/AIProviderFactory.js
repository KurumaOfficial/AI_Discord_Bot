// Authors: Kuruma, Letifer

import { ClaudeProvider } from './providers/ClaudeProvider.js';
import { GrokProvider } from './providers/GrokProvider.js';
import { OpenAICompatibleProvider } from './providers/OpenAICompatibleProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { OpenRouterProvider } from './providers/OpenRouterProvider.js';

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
    case 'openrouter':
      return new OpenRouterProvider({
        logger,
        apiKey: config.providers.openRouter.apiKey,
        baseUrl: config.providers.openRouter.baseUrl,
        model: config.providers.openRouter.model,
        fallbackModel: config.providers.openRouter.fallbackModel,
        httpReferer: config.providers.openRouter.httpReferer,
        appTitle: config.providers.openRouter.appTitle,
        maxTokens: config.providers.openRouter.maxTokens
      });
    default:
      return null;
  }
}
