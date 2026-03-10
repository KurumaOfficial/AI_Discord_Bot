// Authors: Kuruma, Letifer

import { EmbedBuilder } from 'discord.js';
import { truncate } from '../../utils/text.js';

export function buildInfoEmbed({ title, description, color = 0x4f46e5, fields = [] }) {
  const embed = new EmbedBuilder().setTitle(title).setDescription(truncate(description, 4000)).setColor(color);

  for (const field of fields) {
    embed.addFields({
      name: field.name,
      value: truncate(field.value, 1024),
      inline: Boolean(field.inline)
    });
  }

  return embed.setTimestamp();
}

export function buildPlanEmbed({ mode, message, preview }) {
  return buildInfoEmbed({
    title: `Plan Preview (${mode})`,
    description: message,
    color: 0x16a34a,
    fields: [
      {
        name: 'Preview',
        value: preview || 'No preview.'
      }
    ]
  });
}

export function buildErrorEmbed(message) {
  return buildInfoEmbed({
    title: 'Error',
    description: message,
    color: 0xdc2626
  });
}

export function buildSuccessEmbed(title, description) {
  return buildInfoEmbed({
    title,
    description,
    color: 0x16a34a
  });
}
