// Authors: Kuruma, Letifer

import {
  GuildDefaultMessageNotifications,
  GuildVerificationLevel,
  Locale,
  PermissionsBitField
} from 'discord.js';
import { channelTypeToLabel, serializeOverwrite, serializePermissions } from '../utils/discord.js';

function serializeChannel(channel) {
  return {
    id: channel.id,
    name: channel.name,
    type: channelTypeToLabel(channel.type),
    parentId: channel.parentId || null,
    position: channel.rawPosition ?? channel.position ?? 0,
    topic: 'topic' in channel ? channel.topic || '' : '',
    nsfw: 'nsfw' in channel ? Boolean(channel.nsfw) : false,
    bitrate: 'bitrate' in channel ? channel.bitrate || null : null,
    userLimit: 'userLimit' in channel ? channel.userLimit || null : null,
    rateLimitPerUser: 'rateLimitPerUser' in channel ? channel.rateLimitPerUser || 0 : 0,
    permissionOverwrites: channel.permissionOverwrites?.cache?.map(serializeOverwrite) || []
  };
}

function limitArray(items, limit) {
  if (!Number.isInteger(limit) || limit <= 0) {
    return [];
  }

  return items.slice(0, limit);
}

function serializeRole(role) {
  return {
    id: role.id,
    name: role.name,
    color: role.hexColor,
    position: role.position,
    hoist: role.hoist,
    mentionable: role.mentionable,
    managed: role.managed,
    permissions: serializePermissions(role.permissions)
  };
}

function serializeMember(member) {
  return {
    id: member.id,
    displayName: member.displayName,
    bot: member.user.bot,
    roles: member.roles.cache.map((role) => ({ id: role.id, name: role.name })),
    communicationDisabledUntil: member.communicationDisabledUntil?.toISOString() || null
  };
}

function serializeEmoji(emoji) {
  return {
    id: emoji.id,
    name: emoji.name,
    animated: emoji.animated,
    available: emoji.available
  };
}

function serializeSticker(sticker) {
  return {
    id: sticker.id,
    name: sticker.name,
    description: sticker.description || '',
    tags: sticker.tags || ''
  };
}

function serializeAutoModRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled,
    triggerType: rule.triggerType,
    eventType: rule.eventType,
    actions: rule.actions
  };
}

function serializeScheduledEvent(event) {
  return {
    id: event.id,
    name: event.name,
    description: event.description || '',
    channelId: event.channelId || null,
    entityType: event.entityType,
    scheduledStartAt: event.scheduledStartAt?.toISOString() || null,
    scheduledEndAt: event.scheduledEndAt?.toISOString() || null
  };
}

export class GuildSnapshotService {
  constructor(logger) {
    this.logger = logger;
  }

  async createSnapshot(guild, options = {}) {
    const snapshotOptions = {
      profile: options.profile || 'compact',
      roleLimit: options.roleLimit ?? 35,
      channelLimit: options.channelLimit ?? 60,
      memberLimit: options.memberLimit ?? 0,
      emojiLimit: options.emojiLimit ?? 10,
      stickerLimit: options.stickerLimit ?? 10,
      eventLimit: options.eventLimit ?? 10,
      includeMembers: options.includeMembers ?? false,
      includeExpressions: options.includeExpressions ?? true,
      includeAutoModerationRules: options.includeAutoModerationRules ?? false,
      includeScheduledEvents: options.includeScheduledEvents ?? true
    };

    await guild.channels.fetch();
    await guild.roles.fetch();

    const sortedRoles = guild.roles.cache
      .sort((left, right) => right.position - left.position)
      .map(serializeRole);
    const sortedChannels = guild.channels.cache
      .sort((left, right) => (left.rawPosition ?? 0) - (right.rawPosition ?? 0))
      .map(serializeChannel);

    let members = [];
    if (snapshotOptions.includeMembers && snapshotOptions.memberLimit > 0) {
      try {
        const fetchedMembers = await guild.members.fetch({
          limit: snapshotOptions.memberLimit,
          time: 15_000
        });
        members = fetchedMembers.map(serializeMember);
      } catch (error) {
        this.logger.warn('Could not fetch member sample for snapshot.', {
          guildId: guild.id,
          error: error.message
        });
      }
    }

    let emojis = [];
    if (snapshotOptions.includeExpressions && snapshotOptions.emojiLimit > 0) {
      try {
        const fetchedEmojis = await guild.emojis.fetch();
        emojis = limitArray(fetchedEmojis.map(serializeEmoji), snapshotOptions.emojiLimit);
      } catch (error) {
        this.logger.warn('Could not fetch guild emojis.', { guildId: guild.id, error: error.message });
      }
    }

    let stickers = [];
    if (snapshotOptions.includeExpressions && snapshotOptions.stickerLimit > 0) {
      try {
        const fetchedStickers = await guild.stickers.fetch();
        stickers = limitArray(fetchedStickers.map(serializeSticker), snapshotOptions.stickerLimit);
      } catch (error) {
        this.logger.warn('Could not fetch guild stickers.', {
          guildId: guild.id,
          error: error.message
        });
      }
    }

    let autoModerationRules = [];
    if (snapshotOptions.includeAutoModerationRules) {
      try {
        const fetchedRules = await guild.autoModerationRules.fetch();
        autoModerationRules = fetchedRules.map(serializeAutoModRule);
      } catch (error) {
        this.logger.warn('Could not fetch auto moderation rules.', {
          guildId: guild.id,
          error: error.message
        });
      }
    }

    let scheduledEvents = [];
    if (snapshotOptions.includeScheduledEvents && snapshotOptions.eventLimit > 0) {
      try {
        const fetchedEvents = await guild.scheduledEvents.fetch();
        scheduledEvents = limitArray(fetchedEvents.map(serializeScheduledEvent), snapshotOptions.eventLimit);
      } catch (error) {
        this.logger.warn('Could not fetch scheduled events.', {
          guildId: guild.id,
          error: error.message
        });
      }
    }

    const botMember = guild.members.me;

    return {
      exportedAt: new Date().toISOString(),
      snapshotProfile: snapshotOptions.profile,
      snapshotMeta: {
        totals: {
          roles: sortedRoles.length,
          channels: sortedChannels.length,
          members: guild.memberCount ?? null,
          emojis: guild.emojis.cache.size,
          stickers: guild.stickers.cache.size
        },
        included: {
          roles: Math.min(sortedRoles.length, snapshotOptions.roleLimit),
          channels: Math.min(sortedChannels.length, snapshotOptions.channelLimit),
          members: members.length,
          emojis: emojis.length,
          stickers: stickers.length,
          autoModerationRules: autoModerationRules.length,
          scheduledEvents: scheduledEvents.length
        },
        omitted: {
          roles: Math.max(0, sortedRoles.length - snapshotOptions.roleLimit),
          channels: Math.max(0, sortedChannels.length - snapshotOptions.channelLimit),
          members: Math.max(0, (guild.memberCount ?? members.length) - members.length),
          emojis: Math.max(0, guild.emojis.cache.size - emojis.length),
          stickers: Math.max(0, guild.stickers.cache.size - stickers.length)
        }
      },
      guild: {
        id: guild.id,
        name: guild.name,
        description: guild.description || '',
        locale: guild.preferredLocale || Locale.EnglishUS,
        verificationLevel: GuildVerificationLevel[guild.verificationLevel] ?? guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications:
          GuildDefaultMessageNotifications[guild.defaultMessageNotifications] ??
          guild.defaultMessageNotifications,
        afkChannelId: guild.afkChannelId || null,
        systemChannelId: guild.systemChannelId || null,
        rulesChannelId: guild.rulesChannelId || null,
        publicUpdatesChannelId: guild.publicUpdatesChannelId || null
      },
      botPermissions: botMember
        ? new PermissionsBitField(botMember.permissions).toArray()
        : [],
      roles: limitArray(sortedRoles, snapshotOptions.roleLimit),
      channels: limitArray(sortedChannels, snapshotOptions.channelLimit),
      members,
      emojis,
      stickers,
      autoModerationRules,
      scheduledEvents
    };
  }
}
