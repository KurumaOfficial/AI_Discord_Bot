// Authors: Kuruma, Letifer

import { canUseAdministrationFlows } from '../permissions.js';
import { buildBridgeButtons, buildPlanButtons } from '../ui/components.js';
import { buildErrorEmbed, buildInfoEmbed, buildPlanEmbed, buildSuccessEmbed } from '../ui/embeds.js';

async function readFirstTextAttachment(message) {
  const attachment = message.attachments.first();
  if (!attachment) {
    return null;
  }

  const response = await fetch(attachment.url);
  if (!response.ok) {
    throw new Error(`Could not fetch attachment: ${response.status}`);
  }

  return response.text();
}

export class MessageHandler {
  constructor({ config, services, logger }) {
    this.config = config;
    this.services = services;
    this.logger = logger;
  }

  async handle(message) {
    if (message.author.bot || !message.guild) {
      return;
    }

    const settings = this.services.guildSettingsService.getSettings(message.guild.id);
    const prefix = settings.prefix || this.config.prefixSymbol;

    if (!message.content.startsWith(prefix)) {
      return;
    }

    if (!canUseAdministrationFlows(message.member, this.config)) {
      await message.reply({
        embeds: [buildErrorEmbed('You need server management permissions to use this bot.')]
      });
      return;
    }

    const rateLimit = this.services.rateLimiter.consume(`message:${message.author.id}`);
    if (!rateLimit.allowed) {
      await message.reply({
        embeds: [
          buildErrorEmbed(`Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`)
        ]
      });
      return;
    }

    const body = message.content.slice(prefix.length).trim();
    if (!body) {
      await message.reply({
        embeds: [buildInfoEmbed({ title: 'Prefix Active', description: `Current prefix: ${prefix}` })]
      });
      return;
    }

    const [token, ...restParts] = body.split(/\s+/);
    const rest = restParts.join(' ').trim();

    try {
      switch (token.toLowerCase()) {
        case 'help':
          await message.reply({
            embeds: [
              buildInfoEmbed({
                title: 'Kuruma Discord Bot',
                description:
                  'Talk naturally after the prefix or use commands like `mode`, `template`, `state`, and `apply`.'
              })
            ],
            components: [buildBridgeButtons()]
          });
          return;
        case 'mode':
          if (!rest) {
            throw new Error('Usage: !mode rich|bridge');
          }
          await this.services.guildSettingsService.setMode(message.guild.id, rest.toLowerCase());
          await message.reply({
            embeds: [buildSuccessEmbed('Mode Updated', `New mode: ${rest.toLowerCase()}`)]
          });
          return;
        case 'template': {
          if (!rest) {
            throw new Error('Usage: !template gaming');
          }
          const result = await this.services.serverArchitectService.createTemplatePlan({
            guildId: message.guild.id,
            templateName: rest
          });
          await message.reply({
            embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
            components: [buildPlanButtons(result.planId)]
          });
          return;
        }
        case 'state': {
          const attachment = await this.services.serverArchitectService.exportSnapshotAttachment(message.guild);
          await message.reply({
            embeds: [
              buildSuccessEmbed('Snapshot Exported', 'Current guild state attached as JSON.')
            ],
            files: [attachment]
          });
          return;
        }
        case 'apply': {
          const rawPayload = rest || (await readFirstTextAttachment(message));
          if (!rawPayload) {
            throw new Error('Use !apply <payload> or attach a text file with KURUMA_PLAN_V1.');
          }

          const result = await this.services.serverArchitectService.handleBridgeReply({
            guild: message.guild,
            rawText: rawPayload,
            authorTag: message.author.tag
          });

          if (result.kind === 'plan') {
            await message.reply({
              embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
              components: [buildPlanButtons(result.planId)]
            });
            return;
          }

          await message.reply({
            embeds: [buildInfoEmbed({ title: 'Bridge Reply', description: result.message })]
          });
          return;
        }
        default: {
          const result = await this.services.serverArchitectService.handleNaturalLanguageRequest({
            guild: message.guild,
            userMessage: body,
            authorTag: message.author.tag
          });

          if (result.kind === 'plan') {
            await message.reply({
              embeds: [buildPlanEmbed({ mode: result.mode, message: result.message, preview: result.preview })],
              components: [buildPlanButtons(result.planId)]
            });
            return;
          }

          if (result.kind === 'bridge') {
            await message.reply({
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

          await message.reply({
            embeds: [
              buildInfoEmbed({
                title: 'Assistant Reply',
                description: result.message
              })
            ]
          });
        }
      }
    } catch (error) {
      this.logger.error('Prefix message handling failed.', {
        guildId: message.guild.id,
        error: error.message
      });

      await message.reply({
        embeds: [buildErrorEmbed(error.message)]
      });
    }
  }
}
