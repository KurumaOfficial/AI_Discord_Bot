// Authors: Kuruma, Letifer

import { AttachmentBuilder } from 'discord.js';
import { BRIDGE_HEADER } from '../config/constants.js';
import { extractBridgePayload } from '../utils/structuredOutput.js';

export class BridgePackageService {
  constructor({ promptBuilder, bridgeMasterPrompt, logger }) {
    this.promptBuilder = promptBuilder;
    this.bridgeMasterPrompt = bridgeMasterPrompt;
    this.logger = logger;
  }

  createPackageAttachment({ guildName, guildSnapshot, userRequest, bridgeHistory }) {
    const content = this.promptBuilder.buildBridgePackage({
      bridgeMasterPrompt: this.bridgeMasterPrompt,
      guildSnapshot,
      userRequest,
      bridgeHistory
    });

    return new AttachmentBuilder(Buffer.from(content, 'utf8'), {
      name: `${guildName.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()}-bridge-package.txt`
    });
  }

  parseBridgeReply(rawText) {
    const payload = extractBridgePayload(rawText);
    if (!payload) {
      throw new Error(
        `Bridge reply does not contain ${BRIDGE_HEADER} with a valid JSON payload.`
      );
    }

    return payload;
  }
}
