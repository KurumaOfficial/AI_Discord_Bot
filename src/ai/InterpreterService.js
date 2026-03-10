// Authors: Kuruma, Letifer

import { extractJsonObject } from '../utils/structuredOutput.js';

export class InterpreterService {
  constructor({ provider, promptBuilder, planValidator, richSystemPrompt, logger }) {
    this.provider = provider;
    this.promptBuilder = promptBuilder;
    this.planValidator = planValidator;
    this.richSystemPrompt = richSystemPrompt;
    this.logger = logger;
  }

  async interpretConversation({ guildSnapshot, conversation, userMessage, taskHint }) {
    if (!this.provider) {
      throw new Error('AI provider is not configured.');
    }

    const userPrompt = this.promptBuilder.buildRichUserPrompt({
      guildSnapshot,
      conversation,
      userMessage,
      taskHint
    });

    const rawOutput = await this.provider.requestJson({
      systemPrompt: this.richSystemPrompt,
      userPrompt
    });

    const payload = extractJsonObject(rawOutput);
    if (!payload) {
      this.logger.error('AI output did not contain valid JSON.', { rawOutput });
      throw new Error('AI output was not valid JSON.');
    }

    return this.planValidator.parseAssistantEnvelope(payload);
  }
}
