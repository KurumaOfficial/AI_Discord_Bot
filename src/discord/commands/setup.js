// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildBridgeButtons, buildPlanButtons } from '../ui/components.js';
import { buildInfoEmbed, buildPlanEmbed } from '../ui/embeds.js';

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Describe the Discord server structure you want')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Natural language request for the server architecture')
        .setRequired(true)
    ),
  async execute(interaction, services) {
    await interaction.deferReply({ ephemeral: true });

    const prompt = interaction.options.getString('prompt', true);
    const result = await services.serverArchitectService.handleNaturalLanguageRequest({
      guild: interaction.guild,
      userMessage: prompt,
      taskHint: 'setup',
      authorTag: interaction.user.tag
    });

    if (result.kind === 'plan') {
      await interaction.editReply({
        embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
        components: [buildPlanButtons(result.planId)]
      });
      return;
    }

    if (result.kind === 'bridge') {
      await interaction.editReply({
        embeds: [
          buildInfoEmbed({
            title: 'Bridge Package Ready',
            description: result.message
          })
        ],
        files: [result.attachment],
        components: [buildBridgeButtons()]
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        buildInfoEmbed({
          title: 'Assistant Reply',
          description: result.message
        })
      ]
    });
  }
};
