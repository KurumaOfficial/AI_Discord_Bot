// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIProvider } from '../src/ai/AIProviderFactory.js';
import { OpenRouterProvider } from '../src/ai/providers/OpenRouterProvider.js';

function createLogger() {
  return {
    warn() {},
    info() {},
    error() {}
  };
}

test('createAIProvider returns OpenRouterProvider for openrouter mode', () => {
  const provider = createAIProvider(
    {
      aiProvider: 'openrouter',
      providers: {
        openRouter: {
          apiKey: 'token',
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          fallbackModel: 'meta-llama/llama-3.3-70b-instruct:free',
          baseUrl: 'https://openrouter.ai/api/v1',
          httpReferer: 'https://example.com',
          appTitle: 'Kuruma Discord Bot',
          maxTokens: 2048
        }
      }
    },
    createLogger()
  );

  assert.ok(provider instanceof OpenRouterProvider);
  assert.equal(provider.model, 'nvidia/nemotron-3-nano-30b-a3b:free');
  assert.equal(provider.fallbackModel, 'meta-llama/llama-3.3-70b-instruct:free');
});

test('OpenRouterProvider retries with fallback model after 429', async () => {
  const calls = [];
  const originalFetch = global.fetch;

  global.fetch = async (url, options) => {
    calls.push({ url, options });

    if (calls.length === 1) {
      return {
        ok: false,
        status: 429,
        async text() {
          return 'rate limited';
        }
      };
    }

    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: '{"intent":"chat","assistantMessage":"ok"}'
              }
            }
          ]
        };
      }
    };
  };

  try {
    const provider = new OpenRouterProvider({
      logger: createLogger(),
      apiKey: 'token',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'nvidia/nemotron-3-nano-30b-a3b:free',
      fallbackModel: 'meta-llama/llama-3.3-70b-instruct:free',
      httpReferer: 'https://example.com',
      appTitle: 'Kuruma Discord Bot',
      maxTokens: 2048
    });

    const content = await provider.requestJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Build a server plan.'
    });

    assert.equal(content, '{"intent":"chat","assistantMessage":"ok"}');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
    assert.equal(calls[0].options.headers['HTTP-Referer'], 'https://example.com');
    assert.equal(calls[0].options.headers['X-OpenRouter-Title'], 'Kuruma Discord Bot');

    const firstBody = JSON.parse(calls[0].options.body);
    const secondBody = JSON.parse(calls[1].options.body);

    assert.equal(firstBody.model, 'nvidia/nemotron-3-nano-30b-a3b:free');
    assert.equal(firstBody.max_tokens, 2048);
    assert.deepEqual(firstBody.response_format, { type: 'json_object' });
    assert.equal(secondBody.model, 'meta-llama/llama-3.3-70b-instruct:free');
  } finally {
    global.fetch = originalFetch;
  }
});
