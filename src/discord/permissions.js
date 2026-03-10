// Authors: Kuruma, Letifer

import { PermissionFlagsBits } from 'discord.js';

export function canUseAdministrationFlows(member, config) {
  if (!member) {
    return false;
  }

  if (config.ownerIds.includes(member.id)) {
    return true;
  }

  return member.permissions.has([
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles
  ]);
}
