// Authors: Kuruma, Letifer

import { AttachmentBuilder } from 'discord.js';
import { formatPlanPreview } from '../engine/PlanFormatter.js';

export class ServerArchitectService {
  constructor({
    guildSettingsService,
    guildSnapshotService,
    conversationService,
    interpreterService,
    bridgePackageService,
    planValidator,
    pendingPlanService,
    actionExecutor,
    templateService,
    logger
  }) {
    this.guildSettingsService = guildSettingsService;
    this.guildSnapshotService = guildSnapshotService;
    this.conversationService = conversationService;
    this.interpreterService = interpreterService;
    this.bridgePackageService = bridgePackageService;
    this.planValidator = planValidator;
    this.pendingPlanService = pendingPlanService;
    this.actionExecutor = actionExecutor;
    this.templateService = templateService;
    this.logger = logger;
  }

  async handleNaturalLanguageRequest({ guild, userMessage, taskHint = 'general', authorTag = '' }) {
    const settings = this.guildSettingsService.getSettings(guild.id);
    const guildSnapshot = await this.guildSnapshotService.createSnapshot(
      guild,
      this.resolveSnapshotOptions({ taskHint, userMessage, mode: settings.mode })
    );

    if (settings.mode === 'rich' && this.interpreterService?.provider) {
      return this.handleRichRequest({
        guild,
        guildSnapshot,
        userMessage,
        taskHint,
        authorTag
      });
    }

    return this.handleBridgeRequest({
      guild,
      guildSnapshot,
      userMessage,
      authorTag,
      reason:
        settings.mode === 'rich'
          ? 'AI provider is not configured, so the bot switched to bridge mode.'
          : 'Bridge mode is enabled for this server.'
    });
  }

  async handleRichRequest({ guild, guildSnapshot, userMessage, taskHint, authorTag }) {
    await this.conversationService.appendConversationTurn(guild.id, {
      role: 'user',
      authorTag,
      content: userMessage,
      createdAt: new Date().toISOString()
    });

    try {
      const envelope = await this.interpreterService.interpretConversation({
        guildSnapshot,
        conversation: this.conversationService.getConversation(guild.id),
        userMessage,
        taskHint
      });

      await this.conversationService.appendConversationTurn(guild.id, {
        role: 'assistant',
        content: envelope.assistantMessage,
        createdAt: new Date().toISOString()
      });

      if (envelope.intent === 'plan' && envelope.plan) {
        const plan = this.planValidator.parsePlan(envelope.plan);
        const planId = await this.pendingPlanService.createPendingPlan(guild.id, {
          source: 'rich',
          request: userMessage,
          assistantMessage: envelope.assistantMessage,
          plan
        });

        return {
          kind: 'plan',
          mode: 'rich',
          planId,
          plan,
          message: envelope.assistantMessage || envelope.summary || plan.summary,
          preview: formatPlanPreview(plan)
        };
      }

      return {
        kind: envelope.intent,
        mode: 'rich',
        message: envelope.assistantMessage || envelope.summary || 'No message returned.',
        followUpQuestions: envelope.followUpQuestions
      };
    } catch (error) {
      this.logger.error('Rich mode failed, falling back to bridge mode.', {
        guildId: guild.id,
        error: error.message
      });

      return this.handleBridgeRequest({
        guild,
        guildSnapshot,
        userMessage,
        authorTag,
        reason: `Rich mode failed: ${error.message}`
      });
    }
  }

  async handleBridgeRequest({ guild, guildSnapshot, userMessage, authorTag, reason }) {
    await this.conversationService.appendBridgeHistory(guild.id, {
      role: 'user',
      authorTag,
      content: userMessage,
      createdAt: new Date().toISOString()
    });

    const attachment = this.bridgePackageService.createPackageAttachment({
      guildName: guild.name,
      guildSnapshot,
      userRequest: userMessage,
      bridgeHistory: this.conversationService.getBridgeHistory(guild.id)
    });

    return {
      kind: 'bridge',
      mode: 'bridge',
      message: [
        reason,
        'Paste the attached bridge package into ChatGPT, Grok, Claude, or another browser model.',
        'Then paste the returned KURUMA_PLAN_V1 payload back into the bot through the modal, /bridge_apply file:<txt>, or !apply with a text attachment.'
      ].join('\n'),
      attachment
    };
  }

  async handleBridgeReply({ guild, rawText, authorTag = '' }) {
    const payload = this.bridgePackageService.parseBridgeReply(rawText);

    await this.conversationService.appendBridgeHistory(guild.id, {
      role: 'assistant',
      authorTag,
      content: payload.assistantMessage || payload.summary || rawText,
      createdAt: new Date().toISOString()
    });

    if (payload.intent === 'question') {
      return {
        kind: 'question',
        mode: 'bridge',
        message: payload.assistantMessage || payload.summary || 'The external AI needs more details.'
      };
    }

    if (!payload.plan) {
      throw new Error('Bridge reply does not include a plan.');
    }

    const plan = this.planValidator.parsePlan(payload.plan);
    const planId = await this.pendingPlanService.createPendingPlan(guild.id, {
      source: 'bridge',
      request: 'bridge reply',
      assistantMessage: payload.assistantMessage,
      plan
    });

    return {
      kind: 'plan',
      mode: 'bridge',
      planId,
      plan,
      message: payload.assistantMessage || payload.summary || plan.summary,
      preview: formatPlanPreview(plan)
    };
  }

  async createTemplatePlan({ guildId, templateName }) {
    const plan = this.templateService.buildTemplatePlan(templateName);
    const planId = await this.pendingPlanService.createPendingPlan(guildId, {
      source: 'template',
      request: templateName,
      assistantMessage: plan.summary,
      plan
    });

    return {
      kind: 'plan',
      mode: 'template',
      planId,
      plan,
      message: `Template "${templateName}" is ready.`,
      preview: formatPlanPreview(plan)
    };
  }

  async exportSnapshotAttachment(guild) {
    const snapshot = await this.guildSnapshotService.createSnapshot(guild, {
      profile: 'export',
      roleLimit: 100,
      channelLimit: 150,
      memberLimit: 100,
      emojiLimit: 50,
      stickerLimit: 50,
      eventLimit: 50,
      includeMembers: true,
      includeExpressions: true,
      includeAutoModerationRules: true,
      includeScheduledEvents: true
    });
    return new AttachmentBuilder(Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8'), {
      name: `${guild.name.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()}-snapshot.json`
    });
  }

  async executePendingPlan({ guild, planId }) {
    const pendingPlan = await this.pendingPlanService.claimPendingPlan(guild.id, planId);
    let results = [];

    try {
      results = await this.actionExecutor.executePlan(guild, pendingPlan.plan);
    } catch (error) {
      await this.pendingPlanService.releasePendingPlan(guild.id, planId, {
        lastError: error.message
      });
      throw error;
    }

    const hasFailures = results.some((entry) => !entry.success);

    if (!hasFailures) {
      await this.pendingPlanService.removePendingPlan(guild.id, planId);
    } else {
      await this.pendingPlanService.releasePendingPlan(guild.id, planId, {
        lastError: results.filter((entry) => !entry.success).map((entry) => entry.error).join(' | ')
      });
    }

    return {
      plan: pendingPlan.plan,
      results,
      keptPending: hasFailures,
      summary: this.buildExecutionSummary(results, { keptPending: hasFailures })
    };
  }

  async cancelPendingPlan({ guildId, planId }) {
    const pendingPlan = this.pendingPlanService.getPendingPlan(guildId, planId);
    if (!pendingPlan) {
      return false;
    }

    await this.pendingPlanService.removePendingPlan(guildId, planId);
    return true;
  }

  getPendingPlan(guildId, planId) {
    return this.pendingPlanService.getPendingPlan(guildId, planId);
  }

  buildExecutionSummary(results, { keptPending = false } = {}) {
    const successCount = results.filter((entry) => entry.success).length;
    const failureCount = results.length - successCount;
    const lines = [`Executed ${results.length} action(s): ${successCount} succeeded, ${failureCount} failed.`];

    for (const entry of results.slice(0, 20)) {
      lines.push(
        `${entry.success ? 'OK' : 'FAIL'} ${entry.type}${entry.error ? ` -> ${entry.error}` : ''}`
      );
    }

    if (keptPending) {
      lines.push('');
      lines.push('The plan was kept pending so you can retry after fixing the failing parts.');
    }

    return lines.join('\n');
  }

  resolveSnapshotOptions({ taskHint, userMessage, mode }) {
    const hint = String(taskHint || 'general').toLowerCase();
    const text = String(userMessage || '').toLowerCase();

    const analysisRequest =
      ['analyze', 'permissions', 'audit', 'security'].includes(hint) ||
      /(permission|permissions|role|roles|audit|security|moderation|analy[sz]e|rights|access)/i.test(text);

    const casualRequest =
      hint === 'general' &&
      !/(server|discord|channel|channels|role|roles|permission|permissions|category|categories|moderation|emoji|sticker|event|bot|guild)/i.test(
        text
      ) &&
      text.length < 160;

    if (casualRequest) {
      return {
        profile: 'minimal',
        roleLimit: 15,
        channelLimit: 20,
        memberLimit: 0,
        emojiLimit: 0,
        stickerLimit: 0,
        eventLimit: 0,
        includeMembers: false,
        includeExpressions: false,
        includeAutoModerationRules: false,
        includeScheduledEvents: false
      };
    }

    if (analysisRequest) {
      return {
        profile: mode === 'bridge' ? 'analysis-bridge' : 'analysis',
        roleLimit: 50,
        channelLimit: 80,
        memberLimit: 30,
        emojiLimit: 20,
        stickerLimit: 20,
        eventLimit: 15,
        includeMembers: true,
        includeExpressions: true,
        includeAutoModerationRules: true,
        includeScheduledEvents: true
      };
    }

    return {
      profile: 'compact',
      roleLimit: 35,
      channelLimit: 60,
      memberLimit: 0,
      emojiLimit: 10,
      stickerLimit: 10,
      eventLimit: 10,
      includeMembers: false,
      includeExpressions: true,
      includeAutoModerationRules: false,
      includeScheduledEvents: true
    };
  }
}
