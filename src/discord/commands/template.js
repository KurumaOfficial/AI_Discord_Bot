// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { getTemplateNames } from '../../engine/templates.js';
import { buildPlanButtons } from '../ui/components.js';
import { buildPlanEmbed } from '../ui/embeds.js';

const builder = new SlashCommandBuilder()
  .setName('template')
  .setDescription('Load a built-in server template')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('Template name')
      .setRequired(true)
      .addChoices(...getTemplateNames().map((name) => ({ name, value: name })))
  );

export const templateCommand = {
  data: builder,
  async execute(interaction, services) {
    const name = interaction.options.getString('name', true);
    const result = await services.serverArchitectService.createTemplatePlan({
      guildId: interaction.guildId,
      templateName: name
    });

    await interaction.reply({
      embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
      components: [buildPlanButtons(result.planId)],
      ephemeral: true
    });
  }
};
