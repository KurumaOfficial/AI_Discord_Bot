// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildSuccessEmbed } from '../ui/embeds.js';

export const exportStateCommand = {
  data: new SlashCommandBuilder()
    .setName('export_state')
    .setDescription('Export the current guild snapshot as JSON'),
  async execute(interaction, services) {
    const attachment = await services.serverArchitectService.exportSnapshotAttachment(interaction.guild);
    await interaction.reply({
      embeds: [
        buildSuccessEmbed(
          'Snapshot Exported',
          'Use this file for bridge mode or to inspect the current server state.'
        )
      ],
      files: [attachment],
      ephemeral: true
    });
  }
};
