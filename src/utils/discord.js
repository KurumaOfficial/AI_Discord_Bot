// Authors: Kuruma, Letifer

import { ChannelType, PermissionsBitField } from 'discord.js';

export function serializePermissions(bitfieldLike) {
  const permissions = new PermissionsBitField(bitfieldLike ?? 0n);
  return permissions.toArray();
}

export function parsePermissions(permissionNames = []) {
  if (!Array.isArray(permissionNames) || permissionNames.length === 0) {
    return 0n;
  }

  return permissionNames.reduce((accumulator, name) => {
    const value = PermissionsBitField.Flags[name];
    if (!value) {
      return accumulator;
    }

    return accumulator | BigInt(value);
  }, 0n);
}

export function channelTypeToLabel(type) {
  const entry = Object.entries(ChannelType).find(([, value]) => value === type);
  return entry ? entry[0] : String(type);
}

export function serializeOverwrite(overwrite) {
  return {
    id: overwrite.id,
    type: overwrite.type,
    allow: serializePermissions(overwrite.allow),
    deny: serializePermissions(overwrite.deny)
  };
}

export function normalizeColor(color) {
  if (!color) {
    return undefined;
  }

  if (typeof color === 'number') {
    return color;
  }

  if (typeof color === 'string' && color.startsWith('#')) {
    return Number.parseInt(color.slice(1), 16);
  }

  return color;
}
