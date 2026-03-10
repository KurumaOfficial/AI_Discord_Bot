// Authors: Kuruma, Letifer

import { SlashCommandBuilder } from 'discord.js';
import { buildBridgeButtons } from '../ui/components.js';
import { buildInfoEmbed } from '../ui/embeds.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show how Kuruma Discord Bot works'),
  async execute(interaction) {
    const embed = buildInfoEmbed({
      title: 'Kuruma Discord Bot',
      description:
        'AI Discord Server Architect by Kuruma and Letifer. Use rich mode for direct AI calls, or bridge mode when you want to work through ChatGPT, Grok, Claude, or another browser chatbot.',
      fields: [
        {
          name: 'Slash commands',
          value:
            '/setup, /template, /analyze_server, /fix_permissions, /mode, /export_state, /bridge_apply'
        },
        {
          name: 'Prefix chat',
          value:
            'Use the configured prefix, default `!`, then talk naturally. Example: `! make this server cleaner and fix staff permissions`'
        },
        {
          name: 'Bridge flow',
          value:
            'Ask normally in Discord, get a bridge package, paste it into an external AI, then return the `KURUMA_PLAN_V1` payload through the modal, `/bridge_apply file`, or `!apply` with a text attachment.'
        }
      ]
    });

    await interaction.reply({
      embeds: [embed],
      components: [buildBridgeButtons()],
      ephemeral: true
    });
  }
};
