// Authors: Kuruma, Letifer

import { BUTTON_CUSTOM_IDS, MODAL_CUSTOM_IDS } from '../../config/constants.js';
import { commandModules, getCommandMap } from '../commands/index.js';
import { canUseAdministrationFlows } from '../permissions.js';
import { buildBridgeModal } from '../ui/components.js';
import { buildErrorEmbed, buildInfoEmbed, buildPlanEmbed, buildSuccessEmbed } from '../ui/embeds.js';
import { buildPlanButtons } from '../ui/components.js';
import { toCodeBlock, truncate } from '../../utils/text.js';

export class InteractionHandler {
  constructor({ config, services, logger }) {
    this.config = config;
    this.services = services;
    this.logger = logger;
    this.commands = getCommandMap();
  }

  getCommandDefinitions() {
    return commandModules.map((command) => command.data.toJSON());
  }

  async handle(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        return this.handleSlashCommand(interaction);
      }

      if (interaction.isButton()) {
        return this.handleButton(interaction);
      }

      if (interaction.isModalSubmit()) {
        return this.handleModal(interaction);
      }
    } catch (error) {
      this.logger.error('Interaction handler failure.', {
        interactionType: interaction.type,
        guildId: interaction.guildId,
        error: error.message
      });

      const payload = {
        embeds: [buildErrorEmbed(error.message)],
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else if (interaction.isRepliable()) {
        await interaction.reply(payload);
      }
    }
  }

  consumeRateLimit(userId) {
    return this.services.rateLimiter.consume(`interaction:${userId}`);
  }

  async handleSlashCommand(interaction) {
    const command = this.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({
        embeds: [buildErrorEmbed(`Unknown command: ${interaction.commandName}`)],
        ephemeral: true
      });
    }

    if (!canUseAdministrationFlows(interaction.member, this.config)) {
      return interaction.reply({
        embeds: [buildErrorEmbed('You need server management permissions to use this bot.')],
        ephemeral: true
      });
    }

    const rateLimit = this.consumeRateLimit(interaction.user.id);
    if (!rateLimit.allowed) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(`Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`)
        ],
        ephemeral: true
      });
    }

    try {
      await command.execute(interaction, this.services);
    } catch (error) {
      this.logger.error('Slash command failed.', {
        command: interaction.commandName,
        guildId: interaction.guildId,
        error: error.message
      });

      const payload = {
        embeds: [buildErrorEmbed(error.message)],
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }

  async handleButton(interaction) {
    if (!canUseAdministrationFlows(interaction.member, this.config)) {
      return interaction.reply({
        embeds: [buildErrorEmbed('You need server management permissions to use this bot.')],
        ephemeral: true
      });
    }

    const rateLimit = this.consumeRateLimit(interaction.user.id);
    if (!rateLimit.allowed) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(`Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`)
        ],
        ephemeral: true
      });
    }

    const [action, planId] = interaction.customId.split(':');

    if (action === BUTTON_CUSTOM_IDS.OPEN_BRIDGE_MODAL) {
      await interaction.showModal(buildBridgeModal());
      return;
    }

    if (action === BUTTON_CUSTOM_IDS.SHOW_PLAN) {
      const pendingPlan = this.services.serverArchitectService.getPendingPlan(interaction.guildId, planId);
      if (!pendingPlan) {
        await interaction.reply({
          embeds: [buildErrorEmbed('Pending plan not found or expired.')],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [
          buildInfoEmbed({
            title: 'Raw Plan JSON',
            description: toCodeBlock(truncate(JSON.stringify(pendingPlan.plan, null, 2), 3900), 'json')
          })
        ],
        ephemeral: true
      });
      return;
    }

    if (action === BUTTON_CUSTOM_IDS.CANCEL_PLAN) {
      const removed = await this.services.serverArchitectService.cancelPendingPlan({
        guildId: interaction.guildId,
        planId
      });

      await interaction.reply({
        embeds: [
          buildSuccessEmbed(
            removed ? 'Plan Cancelled' : 'Plan Already Missing',
            removed ? 'The pending plan was removed.' : 'Nothing to cancel.'
          )
        ],
        ephemeral: true
      });
      return;
    }

    if (action === BUTTON_CUSTOM_IDS.APPLY_PLAN) {
      await interaction.deferReply({ ephemeral: true });
      const executed = await this.services.serverArchitectService.executePendingPlan({
        guild: interaction.guild,
        planId
      });

      await interaction.editReply({
        embeds: [
          executed.keptPending
            ? buildInfoEmbed({
                title: 'Plan Partially Executed',
                description: executed.summary
              })
            : buildSuccessEmbed('Plan Executed', executed.summary)
        ]
      });
      return;
    }

    await interaction.reply({
      embeds: [buildErrorEmbed(`Unknown button action: ${action}`)],
      ephemeral: true
    });
  }

  async handleModal(interaction) {
    if (!canUseAdministrationFlows(interaction.member, this.config)) {
      return interaction.reply({
        embeds: [buildErrorEmbed('You need server management permissions to use this bot.')],
        ephemeral: true
      });
    }

    const rateLimit = this.consumeRateLimit(interaction.user.id);
    if (!rateLimit.allowed) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(`Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`)
        ],
        ephemeral: true
      });
    }

    if (interaction.customId !== MODAL_CUSTOM_IDS.BRIDGE_APPLY) {
      return interaction.reply({
        embeds: [buildErrorEmbed(`Unknown modal: ${interaction.customId}`)],
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const payload = interaction.fields.getTextInputValue('bridge_payload');
    const result = await this.services.serverArchitectService.handleBridgeReply({
      guild: interaction.guild,
      rawText: payload,
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
  }
}
