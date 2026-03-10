// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildBridgeModal } from '../ui/components.js';
import { buildPlanButtons } from '../ui/components.js';
import { buildInfoEmbed, buildPlanEmbed } from '../ui/embeds.js';

export const bridgeApplyCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge_apply')
    .setDescription('Open the paste window or upload a bridge reply file')
    .addAttachmentOption((option) =>
      option
        .setName('file')
        .setDescription('Optional .txt or .json file containing a KURUMA_PLAN_V1 reply')
    ),
  async execute(interaction, services) {
    const attachment = interaction.options.getAttachment('file');

    if (attachment) {
      await interaction.deferReply({ ephemeral: true });

      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Could not fetch uploaded file: ${response.status}`);
      }

      const rawText = await response.text();
      const result = await services.serverArchitectService.handleBridgeReply({
        guild: interaction.guild,
        rawText,
        authorTag: interaction.user.tag
      });

      if (result.kind === 'plan') {
        await interaction.editReply({
          embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
          components: [buildPlanButtons(result.planId)]
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          buildInfoEmbed({
            title: 'Bridge Reply',
            description: result.message
          })
        ]
      });
      return;
    }

    await interaction.showModal(buildBridgeModal());
  }
};
