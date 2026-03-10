// Authors: Kuruma, Letifer

import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  ChannelType,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel
} from 'discord.js';
import { parsePermissions, normalizeColor } from '../utils/discord.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEnumValue(enumObject, value, fallback) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value in enumObject) {
    return enumObject[value];
  }

  return fallback;
}

async function bufferFromSource(data) {
  if (data.imageBase64) {
    return Buffer.from(data.imageBase64, 'base64');
  }

  if (data.imageUrl) {
    const response = await fetch(data.imageUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch image URL ${data.imageUrl}: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  if (data.fileBase64) {
    return Buffer.from(data.fileBase64, 'base64');
  }

  if (data.fileUrl) {
    const response = await fetch(data.fileUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch file URL ${data.fileUrl}: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  return null;
}

function permissionOverwritePatch({ allow = [], deny = [] }) {
  const patch = {};

  for (const permission of allow) {
    patch[permission] = true;
  }

  for (const permission of deny) {
    patch[permission] = false;
  }

  return patch;
}

function isSnowflake(value) {
  return typeof value === 'string' && /^\d{15,22}$/.test(value);
}

export class ActionExecutor {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
    this.handlers = new Map([
      ['guild.update', this.handleGuildUpdate.bind(this)],
      ['role.create', this.handleRoleCreate.bind(this)],
      ['role.update', this.handleRoleUpdate.bind(this)],
      ['role.delete', this.handleRoleDelete.bind(this)],
      ['role.reposition', this.handleRoleReposition.bind(this)],
      ['channel.create', this.handleChannelCreate.bind(this)],
      ['channel.update', this.handleChannelUpdate.bind(this)],
      ['channel.delete', this.handleChannelDelete.bind(this)],
      ['channel.move', this.handleChannelMove.bind(this)],
      ['channel.clone', this.handleChannelClone.bind(this)],
      ['overwrite.upsert', this.handleOverwriteUpsert.bind(this)],
      ['overwrite.clear', this.handleOverwriteClear.bind(this)],
      ['member.update', this.handleMemberUpdate.bind(this)],
      ['member.role.add', this.handleMemberRoleAdd.bind(this)],
      ['member.role.remove', this.handleMemberRoleRemove.bind(this)],
      ['member.kick', this.handleMemberKick.bind(this)],
      ['member.ban', this.handleMemberBan.bind(this)],
      ['member.unban', this.handleMemberUnban.bind(this)],
      ['automod.create', this.handleAutoModCreate.bind(this)],
      ['automod.update', this.handleAutoModUpdate.bind(this)],
      ['automod.delete', this.handleAutoModDelete.bind(this)],
      ['emoji.create', this.handleEmojiCreate.bind(this)],
      ['emoji.update', this.handleEmojiUpdate.bind(this)],
      ['emoji.delete', this.handleEmojiDelete.bind(this)],
      ['sticker.create', this.handleStickerCreate.bind(this)],
      ['sticker.update', this.handleStickerUpdate.bind(this)],
      ['sticker.delete', this.handleStickerDelete.bind(this)],
      ['event.create', this.handleEventCreate.bind(this)],
      ['event.update', this.handleEventUpdate.bind(this)],
      ['event.delete', this.handleEventDelete.bind(this)],
      ['message.send', this.handleMessageSend.bind(this)]
    ]);
  }

  async executePlan(guild, plan) {
    const results = [];

    await guild.roles.fetch().catch(() => null);
    await guild.channels.fetch().catch(() => null);

    for (const action of plan.actions) {
      const handler = this.handlers.get(action.type);
      if (!handler) {
        const error = `Unsupported action type: ${action.type}`;
        this.logger.warn(error, { guildId: guild.id, action });
        results.push({ type: action.type, success: false, error });
        continue;
      }

      try {
        const result = await handler(guild, action.data || {});
        results.push({
          type: action.type,
          success: true,
          result
        });
      } catch (error) {
        this.logger.error('Action execution failed.', {
          guildId: guild.id,
          actionType: action.type,
          error: error.message
        });
        results.push({
          type: action.type,
          success: false,
          error: error.message
        });
      }

      if (this.config.executionDelayMs > 0) {
        await sleep(this.config.executionDelayMs);
      }
    }

    return results;
  }

  resolveRole(guild, data) {
    const identifier = data.roleId || data.id || data.targetId || data.roleName || data.name || data.targetName;
    if (!identifier) {
      throw new Error('Role identifier is missing.');
    }

    if (isSnowflake(identifier)) {
      const roleById = guild.roles.cache.get(identifier);
      if (roleById) {
        return roleById;
      }
    }

    const roleByName = guild.roles.cache.find(
      (role) => role.name.toLowerCase() === String(identifier).toLowerCase()
    );
    if (!roleByName) {
      throw new Error(`Role not found: ${identifier}`);
    }

    return roleByName;
  }

  resolveRoleReference(guild, identifier) {
    if (!identifier) {
      throw new Error('Role reference is missing.');
    }

    if (isSnowflake(identifier)) {
      return guild.roles.cache.get(identifier) || identifier;
    }

    return this.resolveRole(guild, {
      roleName: identifier,
      name: identifier,
      targetName: identifier
    });
  }

  resolveChannel(guild, data) {
    const identifier =
      data.channelId || data.id || data.targetId || data.channelName || data.channel || data.name || data.targetName;
    if (!identifier) {
      throw new Error('Channel identifier is missing.');
    }

    if (isSnowflake(identifier)) {
      const channelById = guild.channels.cache.get(identifier);
      if (channelById) {
        return channelById;
      }
    }

    const channelByName = guild.channels.cache.find(
      (channel) => channel.name.toLowerCase() === String(identifier).toLowerCase()
    );
    if (!channelByName) {
      throw new Error(`Channel not found: ${identifier}`);
    }

    return channelByName;
  }

  resolveChannelReference(guild, identifier) {
    if (!identifier) {
      throw new Error('Channel reference is missing.');
    }

    if (isSnowflake(identifier)) {
      return guild.channels.cache.get(identifier) || identifier;
    }

    return this.resolveChannel(guild, {
      channelName: identifier,
      channel: identifier,
      name: identifier
    });
  }

  async resolveMember(guild, data) {
    const identifier =
      data.memberId || data.userId || data.id || data.targetId || data.username || data.displayName;
    if (!identifier) {
      throw new Error('Member identifier is missing.');
    }

    if (isSnowflake(identifier)) {
      const cachedMember = guild.members.cache.get(identifier);
      if (cachedMember) {
        return cachedMember;
      }

      return guild.members.fetch(identifier);
    }

    const memberByName = guild.members.cache.find(
      (member) =>
        member.displayName.toLowerCase() === String(identifier).toLowerCase() ||
        member.user.username.toLowerCase() === String(identifier).toLowerCase()
    );
    if (!memberByName) {
      throw new Error(`Member not found: ${identifier}`);
    }

    return memberByName;
  }

  async resolveOverwriteTarget(guild, data) {
    if (data.targetType === 'member' || data.targetType === 'user') {
      return this.resolveMember(guild, data);
    }

    return this.resolveRole(guild, data);
  }

  resolveChannelType(value) {
    return getEnumValue(ChannelType, value, ChannelType.GuildText);
  }

  async resolveParentId(guild, parentValue) {
    if (!parentValue) {
      return undefined;
    }

    const parent = this.resolveChannel(guild, {
      channelId: parentValue,
      channelName: parentValue,
      name: parentValue
    });
    return parent.id;
  }

  async resolveCreateOverwrites(guild, overwrites = []) {
    const resolved = [];

    for (const overwrite of overwrites) {
      const target =
        overwrite.targetType === 'member' || overwrite.targetType === 'user'
          ? await this.resolveMember(guild, overwrite)
          : this.resolveRole(guild, overwrite);

      resolved.push({
        id: target.id,
        allow: parsePermissions(overwrite.allow || []),
        deny: parsePermissions(overwrite.deny || [])
      });
    }

    return resolved;
  }

  resolveRoleReferences(guild, identifiers = []) {
    return identifiers.map((identifier) => this.resolveRoleReference(guild, identifier));
  }

  resolveChannelReferences(guild, identifiers = []) {
    return identifiers.map((identifier) => this.resolveChannelReference(guild, identifier));
  }

  async handleGuildUpdate(guild, data) {
    const payload = {
      name: data.name,
      description: data.description,
      verificationLevel: data.verificationLevel,
      explicitContentFilter: data.explicitContentFilter,
      defaultMessageNotifications: data.defaultMessageNotifications,
      preferredLocale: data.preferredLocale
    };

    if (data.systemChannel) {
      payload.systemChannel = this.resolveChannel(guild, { channel: data.systemChannel });
    }

    if (data.rulesChannel) {
      payload.rulesChannel = this.resolveChannel(guild, { channel: data.rulesChannel });
    }

    if (data.publicUpdatesChannel) {
      payload.publicUpdatesChannel = this.resolveChannel(guild, { channel: data.publicUpdatesChannel });
    }

    if (data.afkChannel) {
      payload.afkChannel = this.resolveChannel(guild, { channel: data.afkChannel });
    }

    if (data.iconUrl || data.iconBase64) {
      payload.icon = await bufferFromSource({
        imageUrl: data.iconUrl,
        imageBase64: data.iconBase64
      });
    }

    return guild.edit(payload);
  }

  async handleRoleCreate(guild, data) {
    return guild.roles.create({
      name: data.name,
      color: normalizeColor(data.color),
      permissions: parsePermissions(data.permissions || []),
      hoist: data.hoist,
      mentionable: data.mentionable,
      reason: data.reason
    });
  }

  async handleRoleUpdate(guild, data) {
    const role = this.resolveRole(guild, data);
    return role.edit({
      name: data.newName || data.name,
      color: normalizeColor(data.color),
      permissions: Array.isArray(data.permissions) ? parsePermissions(data.permissions) : undefined,
      hoist: data.hoist,
      mentionable: data.mentionable,
      reason: data.reason
    });
  }

  async handleRoleDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const role = this.resolveRole(guild, data);
    return role.delete(data.reason);
  }

  async handleRoleReposition(guild, data) {
    const role = this.resolveRole(guild, data);
    return role.setPosition(data.position);
  }

  async handleChannelCreate(guild, data) {
    const payload = {
      name: data.name,
      type: this.resolveChannelType(data.channelType || data.type),
      topic: data.topic,
      nsfw: data.nsfw,
      bitrate: data.bitrate,
      userLimit: data.userLimit,
      rateLimitPerUser: data.rateLimitPerUser,
      reason: data.reason
    };

    if (data.parent) {
      payload.parent = await this.resolveParentId(guild, data.parent);
    }

    if (Array.isArray(data.permissionOverwrites) && data.permissionOverwrites.length > 0) {
      payload.permissionOverwrites = await this.resolveCreateOverwrites(guild, data.permissionOverwrites);
    }

    const channel = await guild.channels.create(payload);

    if (Number.isInteger(data.position)) {
      await channel.setPosition(data.position);
    }

    return channel;
  }

  async handleChannelUpdate(guild, data) {
    const channel = this.resolveChannel(guild, data);
    const payload = {
      name: data.newName || data.name,
      topic: data.topic,
      nsfw: data.nsfw,
      bitrate: data.bitrate,
      userLimit: data.userLimit,
      rateLimitPerUser: data.rateLimitPerUser,
      reason: data.reason
    };

    if (data.parent) {
      payload.parent = await this.resolveParentId(guild, data.parent);
    }

    return channel.edit(payload);
  }

  async handleChannelDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const channel = this.resolveChannel(guild, data);
    return channel.delete(data.reason);
  }

  async handleChannelMove(guild, data) {
    const channel = this.resolveChannel(guild, data);

    if (data.parent) {
      await channel.setParent(await this.resolveParentId(guild, data.parent), {
        lockPermissions: Boolean(data.lockPermissions)
      });
    }

    if (Number.isInteger(data.position)) {
      await channel.setPosition(data.position);
    }

    return channel;
  }

  async handleChannelClone(guild, data) {
    const channel = this.resolveChannel(guild, data);
    return channel.clone({
      name: data.newName || `${channel.name}-clone`,
      reason: data.reason
    });
  }

  async handleOverwriteUpsert(guild, data) {
    const channel = this.resolveChannel(guild, data);
    const target = await this.resolveOverwriteTarget(guild, data);
    return channel.permissionOverwrites.edit(target, permissionOverwritePatch(data), {
      reason: data.reason
    });
  }

  async handleOverwriteClear(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const channel = this.resolveChannel(guild, data);
    const target = await this.resolveOverwriteTarget(guild, data);
    return channel.permissionOverwrites.delete(target, data.reason);
  }

  async handleMemberUpdate(guild, data) {
    const member = await this.resolveMember(guild, data);

    const payload = {
      nick: data.nick,
      deaf: data.deaf,
      mute: data.mute,
      channel: data.channel ? this.resolveChannel(guild, { channel: data.channel }) : undefined,
      communicationDisabledUntil: data.communicationDisabledUntil || undefined,
      reason: data.reason
    };

    return member.edit(payload);
  }

  async handleMemberRoleAdd(guild, data) {
    const member = await this.resolveMember(guild, data);
    const role = this.resolveRole(guild, data);
    return member.roles.add(role, data.reason);
  }

  async handleMemberRoleRemove(guild, data) {
    const member = await this.resolveMember(guild, data);
    const role = this.resolveRole(guild, data);
    return member.roles.remove(role, data.reason);
  }

  async handleMemberKick(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const member = await this.resolveMember(guild, data);
    return member.kick(data.reason);
  }

  async handleMemberBan(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const member = await this.resolveMember(guild, data);
    return guild.members.ban(member, {
      reason: data.reason,
      deleteMessageSeconds: data.deleteMessageSeconds
    });
  }

  async handleMemberUnban(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const userId = data.userId || data.id || data.targetId;
    if (!userId) {
      throw new Error('userId is required for member.unban');
    }

    return guild.bans.remove(userId, data.reason);
  }

  mapAutoModActions(actions = []) {
    return actions.map((action) => ({
      type: getEnumValue(AutoModerationActionType, action.type, action.type),
      metadata: action.metadata || {}
    }));
  }

  async handleAutoModCreate(guild, data) {
    return guild.autoModerationRules.create({
      name: data.name,
      enabled: data.enabled ?? true,
      eventType: getEnumValue(
        AutoModerationRuleEventType,
        data.eventType,
        AutoModerationRuleEventType.MessageSend
      ),
      triggerType: getEnumValue(
        AutoModerationRuleTriggerType,
        data.triggerType,
        AutoModerationRuleTriggerType.Keyword
      ),
      triggerMetadata: data.triggerMetadata || {},
      actions: this.mapAutoModActions(data.actions || []),
      exemptRoles: this.resolveRoleReferences(guild, data.exemptRoles || []),
      exemptChannels: this.resolveChannelReferences(guild, data.exemptChannels || []),
      reason: data.reason
    });
  }

  async handleAutoModUpdate(guild, data) {
    const ruleId = data.ruleId || data.id || data.targetId;
    if (!ruleId) {
      throw new Error('ruleId is required for automod.update');
    }

    const rule = await guild.autoModerationRules.fetch(ruleId);
    return rule.edit({
      name: data.name,
      enabled: data.enabled,
      eventType: data.eventType
        ? getEnumValue(AutoModerationRuleEventType, data.eventType, undefined)
        : undefined,
      triggerMetadata: data.triggerMetadata,
      actions: data.actions ? this.mapAutoModActions(data.actions) : undefined,
      exemptRoles: Array.isArray(data.exemptRoles)
        ? this.resolveRoleReferences(guild, data.exemptRoles)
        : undefined,
      exemptChannels: Array.isArray(data.exemptChannels)
        ? this.resolveChannelReferences(guild, data.exemptChannels)
        : undefined,
      reason: data.reason
    });
  }

  async handleAutoModDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const ruleId = data.ruleId || data.id || data.targetId;
    if (!ruleId) {
      throw new Error('ruleId is required for automod.delete');
    }

    const rule = await guild.autoModerationRules.fetch(ruleId);
    return rule.delete(data.reason);
  }

  async handleEmojiCreate(guild, data) {
    const attachment = await bufferFromSource(data);
    if (!attachment) {
      throw new Error('emoji.create requires imageUrl or imageBase64');
    }

    return guild.emojis.create({
      attachment,
      name: data.name,
      roles: this.resolveRoleReferences(guild, data.roles || []),
      reason: data.reason
    });
  }

  async handleEmojiUpdate(guild, data) {
    const emojiId = data.emojiId || data.id || data.targetId;
    if (!emojiId) {
      throw new Error('emojiId is required for emoji.update');
    }

    const emoji = await guild.emojis.fetch(emojiId);
    return emoji.edit({
      name: data.name,
      roles: Array.isArray(data.roles) ? this.resolveRoleReferences(guild, data.roles) : undefined,
      reason: data.reason
    });
  }

  async handleEmojiDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const emojiId = data.emojiId || data.id || data.targetId;
    if (!emojiId) {
      throw new Error('emojiId is required for emoji.delete');
    }

    const emoji = await guild.emojis.fetch(emojiId);
    return emoji.delete(data.reason);
  }

  async handleStickerCreate(guild, data) {
    const file = await bufferFromSource(data);
    if (!file) {
      throw new Error('sticker.create requires fileUrl/fileBase64/imageUrl/imageBase64');
    }

    return guild.stickers.create({
      file,
      name: data.name,
      tags: data.tags || 'kuruma',
      description: data.description || '',
      reason: data.reason
    });
  }

  async handleStickerUpdate(guild, data) {
    const stickerId = data.stickerId || data.id || data.targetId;
    if (!stickerId) {
      throw new Error('stickerId is required for sticker.update');
    }

    const sticker = await guild.stickers.fetch(stickerId);
    return sticker.edit({
      name: data.name,
      description: data.description,
      tags: data.tags,
      reason: data.reason
    });
  }

  async handleStickerDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const stickerId = data.stickerId || data.id || data.targetId;
    if (!stickerId) {
      throw new Error('stickerId is required for sticker.delete');
    }

    const sticker = await guild.stickers.fetch(stickerId);
    return sticker.delete(data.reason);
  }

  async handleEventCreate(guild, data) {
    return guild.scheduledEvents.create({
      name: data.name,
      description: data.description,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      privacyLevel: getEnumValue(
        GuildScheduledEventPrivacyLevel,
        data.privacyLevel,
        GuildScheduledEventPrivacyLevel.GuildOnly
      ),
      entityType: getEnumValue(
        GuildScheduledEventEntityType,
        data.entityType,
        GuildScheduledEventEntityType.External
      ),
      channel: data.channel ? this.resolveChannel(guild, { channel: data.channel }) : undefined,
      entityMetadata: data.entityMetadata || undefined,
      image: await bufferFromSource(data),
      reason: data.reason
    });
  }

  async handleEventUpdate(guild, data) {
    const eventId = data.eventId || data.id || data.targetId;
    if (!eventId) {
      throw new Error('eventId is required for event.update');
    }

    const event = await guild.scheduledEvents.fetch(eventId);
    return event.edit({
      name: data.name,
      description: data.description,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      channel: data.channel ? this.resolveChannel(guild, { channel: data.channel }) : undefined,
      entityMetadata: data.entityMetadata,
      status: data.status,
      image: data.imageUrl || data.imageBase64 ? await bufferFromSource(data) : undefined,
      reason: data.reason
    });
  }

  async handleEventDelete(guild, data) {
    if (!this.config.allowDestructiveOperations) {
      throw new Error('Destructive operations are disabled in config.');
    }

    const eventId = data.eventId || data.id || data.targetId;
    if (!eventId) {
      throw new Error('eventId is required for event.delete');
    }

    const event = await guild.scheduledEvents.fetch(eventId);
    return event.delete();
  }

  async handleMessageSend(guild, data) {
    const channel = this.resolveChannel(guild, data);
    if (!channel.isTextBased()) {
      throw new Error(`Channel ${channel.name} is not text based.`);
    }

    return channel.send({
      content: data.content || '',
      embeds: data.embeds || [],
      allowedMentions: { parse: [] }
    });
  }
}
