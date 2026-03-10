// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildBridgeButtons, buildPlanButtons } from '../ui/components.js';
import { buildInfoEmbed, buildPlanEmbed } from '../ui/embeds.js';

export const analyzeServerCommand = {
  data: new SlashCommandBuilder()
    .setName('analyze_server')
    .setDescription('Analyze the current server and suggest improvements')
    .addStringOption((option) =>
      option
        .setName('focus')
        .setDescription('Optional focus like permissions, onboarding, channels, moderation')
    ),
  async execute(interaction, services) {
    await interaction.deferReply({ ephemeral: true });

    const focus = interaction.options.getString('focus') || 'full server health, structure, and permissions';
    const result = await services.serverArchitectService.handleNaturalLanguageRequest({
      guild: interaction.guild,
      userMessage: `Analyze this server. Focus: ${focus}. Give practical recommendations and a plan if needed.`,
      taskHint: 'analyze',
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
            title: 'Bridge Analysis Package',
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
          title: 'Server Analysis',
          description: result.message
        })
      ]
    });
  }
};
