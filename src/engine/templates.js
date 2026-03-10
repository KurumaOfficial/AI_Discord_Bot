// Authors: Kuruma, Letifer

import { PLAN_VERSION } from '../config/constants.js';

function textChannel(name, parent, extra = {}) {
  return {
    type: 'channel.create',
    data: {
      name,
      channelType: 'GuildText',
      parent,
      ...extra
    }
  };
}

function voiceChannel(name, parent, extra = {}) {
  return {
    type: 'channel.create',
    data: {
      name,
      channelType: 'GuildVoice',
      parent,
      ...extra
    }
  };
}

function category(name, position) {
  return {
    type: 'channel.create',
    data: {
      name,
      channelType: 'GuildCategory',
      position
    }
  };
}

function role(name, permissions = []) {
  return {
    type: 'role.create',
    data: {
      name,
      permissions
    }
  };
}

export const TEMPLATE_CATALOG = {
  gaming: {
    description: 'Gaming server with announcements, LFG, and voice rooms.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a clean gaming community server structure.',
        reasoning: 'Balanced structure for announcements, community chat, support, and voice.',
        warnings: [],
        actions: [
          role('Admin', ['Administrator']),
          role('Moderator', ['ManageMessages', 'KickMembers', 'BanMembers', 'MuteMembers']),
          role('Player', ['ViewChannel', 'SendMessages', 'Connect', 'Speak']),
          category('Information', 0),
          category('Community', 1),
          category('Voice', 2),
          category('Staff', 3),
          textChannel('rules', 'Information'),
          textChannel('announcements', 'Information'),
          textChannel('general', 'Community'),
          textChannel('memes', 'Community'),
          textChannel('looking-for-group', 'Community'),
          voiceChannel('Squad 1', 'Voice'),
          voiceChannel('Squad 2', 'Voice'),
          voiceChannel('Chill VC', 'Voice'),
          textChannel('staff-chat', 'Staff'),
          {
            type: 'overwrite.upsert',
            data: {
              channel: 'staff-chat',
              targetType: 'role',
              targetName: 'Player',
              deny: ['ViewChannel']
            }
          }
        ]
      };
    }
  },
  startup: {
    description: 'Startup community with product, team, and support spaces.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a startup server with ops, product, and community spaces.',
        reasoning: 'Designed for internal teamwork plus member discussion.',
        warnings: [],
        actions: [
          role('Founder', ['Administrator']),
          role('Team', ['ViewChannel', 'SendMessages', 'ManageThreads']),
          role('Community', ['ViewChannel', 'SendMessages']),
          category('Information', 0),
          category('Team Ops', 1),
          category('Community', 2),
          textChannel('rules', 'Information'),
          textChannel('announcements', 'Information'),
          textChannel('roadmap', 'Information'),
          textChannel('leadership', 'Team Ops'),
          textChannel('dev-updates', 'Team Ops'),
          textChannel('general', 'Community'),
          textChannel('ideas', 'Community'),
          textChannel('support', 'Community'),
          {
            type: 'overwrite.upsert',
            data: {
              channel: 'leadership',
              targetType: 'role',
              targetName: 'Community',
              deny: ['ViewChannel']
            }
          }
        ]
      };
    }
  },
  study: {
    description: 'Study server with resources, sessions, and accountability.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a focused study community structure.',
        reasoning: 'Keeps resources and discussion separate while preserving accountability.',
        warnings: [],
        actions: [
          role('Admin', ['Administrator']),
          role('Mentor', ['ManageMessages', 'ModerateMembers']),
          role('Student', ['ViewChannel', 'SendMessages', 'Connect', 'Speak']),
          category('Start Here', 0),
          category('Study Rooms', 1),
          category('Resources', 2),
          textChannel('welcome', 'Start Here'),
          textChannel('rules', 'Start Here'),
          textChannel('general-study', 'Study Rooms'),
          textChannel('accountability', 'Study Rooms'),
          voiceChannel('Silent Study', 'Study Rooms'),
          voiceChannel('Group Session', 'Study Rooms'),
          textChannel('resources', 'Resources'),
          textChannel('questions', 'Resources')
        ]
      };
    }
  },
  'fan-community': {
    description: 'Fan server with media, events, and spoilers.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a fan community with spoiler-safe organization.',
        reasoning: 'Separates general fandom chat from spoiler discussion and events.',
        warnings: [],
        actions: [
          role('Owner', ['Administrator']),
          role('Moderator', ['ManageMessages', 'ModerateMembers']),
          role('Member', ['ViewChannel', 'SendMessages']),
          category('Info', 0),
          category('Community', 1),
          category('Spoilers', 2),
          textChannel('announcements', 'Info'),
          textChannel('rules', 'Info'),
          textChannel('general', 'Community'),
          textChannel('fan-art', 'Community'),
          textChannel('events', 'Community'),
          textChannel('spoilers', 'Spoilers', { nsfw: false }),
          {
            type: 'overwrite.upsert',
            data: {
              channel: 'spoilers',
              targetType: 'role',
              targetName: 'Member',
              allow: ['ViewChannel', 'SendMessages']
            }
          }
        ]
      };
    }
  },
  creator: {
    description: 'Creator community with releases, feedback, and premium areas.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a creator server with release and community loops.',
        reasoning: 'Keeps content publishing, feedback, and member interaction separated.',
        warnings: [],
        actions: [
          role('Owner', ['Administrator']),
          role('Moderator', ['ManageMessages', 'ModerateMembers']),
          role('Supporter', ['ViewChannel', 'SendMessages']),
          role('Member', ['ViewChannel', 'SendMessages']),
          category('Broadcast', 0),
          category('Community', 1),
          category('Supporters', 2),
          textChannel('announcements', 'Broadcast'),
          textChannel('release-notes', 'Broadcast'),
          textChannel('general', 'Community'),
          textChannel('feedback', 'Community'),
          textChannel('suggestions', 'Community'),
          textChannel('supporter-lounge', 'Supporters'),
          {
            type: 'overwrite.upsert',
            data: {
              channel: 'supporter-lounge',
              targetType: 'role',
              targetName: 'Member',
              deny: ['ViewChannel']
            }
          }
        ]
      };
    }
  },
  support: {
    description: 'Support server with onboarding, ticket intake, and staff rooms.',
    buildPlan() {
      return {
        version: PLAN_VERSION,
        source: 'template',
        summary: 'Create a customer support server layout.',
        reasoning: 'Optimized for triage, FAQs, and staff coordination.',
        warnings: [],
        actions: [
          role('Admin', ['Administrator']),
          role('Support', ['ManageMessages', 'ModerateMembers', 'ViewAuditLog']),
          role('Customer', ['ViewChannel', 'SendMessages']),
          category('Start Here', 0),
          category('Support', 1),
          category('Staff', 2),
          textChannel('welcome', 'Start Here'),
          textChannel('faq', 'Start Here'),
          textChannel('open-a-ticket', 'Support'),
          textChannel('resolved-tickets', 'Support'),
          textChannel('staff-triage', 'Staff'),
          {
            type: 'overwrite.upsert',
            data: {
              channel: 'staff-triage',
              targetType: 'role',
              targetName: 'Customer',
              deny: ['ViewChannel']
            }
          }
        ]
      };
    }
  }
};

export function getTemplateNames() {
  return Object.keys(TEMPLATE_CATALOG);
}

export function getTemplate(name) {
  return TEMPLATE_CATALOG[name] || null;
}
