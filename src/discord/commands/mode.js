// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildSuccessEmbed } from '../ui/embeds.js';

export const modeCommand = {
  data: new SlashCommandBuilder()
    .setName('mode')
    .setDescription('Set the AI mode or prefix for this server')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('rich uses API keys, bridge uses an external browser chatbot')
        .addChoices(
          { name: 'rich', value: 'rich' },
          { name: 'bridge', value: 'bridge' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('prefix')
        .setDescription('Optional prefix override for this guild, for example ! or ?')
        .setMaxLength(5)
    ),
  async execute(interaction, services) {
    const mode = interaction.options.getString('mode');
    const prefix = interaction.options.getString('prefix');

    if (!mode && !prefix) {
      throw new Error('Provide at least one of: mode or prefix.');
    }

    if (mode) {
      await services.guildSettingsService.setMode(interaction.guildId, mode);
    }

    if (prefix) {
      await services.guildSettingsService.setPrefix(interaction.guildId, prefix);
    }

    const settings = services.guildSettingsService.getSettings(interaction.guildId);

    await interaction.reply({
      embeds: [
        buildSuccessEmbed(
          'Settings Updated',
          `Mode: ${settings.mode}\nPrefix: ${settings.prefix}\nDestructive ops: ${settings.allowDestructiveOperations}`
        )
      ],
      ephemeral: true
    });
  }
};
