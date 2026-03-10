// Authors: Kuruma, Letifer

export class PromptBuilder {
  buildRichUserPrompt({ guildSnapshot, conversation, userMessage, taskHint = 'general' }) {
    const serializedConversation = JSON.stringify(conversation, null, 2);
    const serializedSnapshot = JSON.stringify(guildSnapshot, null, 2);

    return [
      `Task hint: ${taskHint}`,
      '',
      'Recent conversation:',
      serializedConversation,
      '',
      'Current guild snapshot:',
      serializedSnapshot,
      '',
      `User message: ${userMessage}`
    ].join('\n');
  }

  buildBridgePackage({ bridgeMasterPrompt, guildSnapshot, userRequest, bridgeHistory = [] }) {
    const serializedHistory = JSON.stringify(bridgeHistory, null, 2);
    const serializedSnapshot = JSON.stringify(guildSnapshot, null, 2);

    return [
      '# Kuruma Discord Bot Bridge Package',
      '',
      'Paste the full content of this file into ChatGPT, Grok, Claude, or another browser model.',
      'Then add your request or continue the conversation there.',
      '',
      '## Special Prompt',
      bridgeMasterPrompt,
      '',
      '## Previous Bridge History',
      serializedHistory,
      '',
      '## Current Guild Snapshot',
      serializedSnapshot,
      '',
      '## Current User Request',
      userRequest
    ].join('\n');
  }
}
