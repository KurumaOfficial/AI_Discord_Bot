// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildBridgeButtons, buildPlanButtons } from '../ui/components.js';
import { buildInfoEmbed, buildPlanEmbed } from '../ui/embeds.js';

export const fixPermissionsCommand = {
  data: new SlashCommandBuilder()
    .setName('fix_permissions')
    .setDescription('Analyze or repair permission issues on this server')
    .addStringOption((option) =>
      option
        .setName('goal')
        .setDescription('Optional goal, for example "tighten moderator access"')
    ),
  async execute(interaction, services) {
    await interaction.deferReply({ ephemeral: true });

    const goal = interaction.options.getString('goal') || 'make permissions cleaner, safer, and more professional';
    const result = await services.serverArchitectService.handleNaturalLanguageRequest({
      guild: interaction.guild,
      userMessage: `Inspect the current permission setup and propose fixes. Goal: ${goal}.`,
      taskHint: 'permissions',
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
            title: 'Bridge Permission Package',
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
          title: 'Permission Analysis',
          description: result.message
        })
      ]
    });
  }
};
