// Authors: Kuruma, Letifer

import { Client, Events } from 'discord.js';
import { createAIProvider } from './ai/AIProviderFactory.js';
import { InterpreterService } from './ai/InterpreterService.js';
import { PromptBuilder } from './ai/PromptBuilder.js';
import { loadConfig, validateRuntimeConfig } from './config/loadConfig.js';
import { CLIENT_OPTIONS } from './config/constants.js';
import { InteractionHandler } from './discord/handlers/InteractionHandler.js';
import { MessageHandler } from './discord/handlers/MessageHandler.js';
import { ActionExecutor } from './engine/ActionExecutor.js';
import { PlanValidator } from './engine/PlanValidator.js';
import { BridgePackageService } from './services/BridgePackageService.js';
import { ConversationService } from './services/ConversationService.js';
import { GuildSettingsService } from './services/GuildSettingsService.js';
import { GuildSnapshotService } from './services/GuildSnapshotService.js';
import { PendingPlanService } from './services/PendingPlanService.js';
import { ServerArchitectService } from './services/ServerArchitectService.js';
import { TemplateService } from './services/TemplateService.js';
import { JsonStore } from './storage/JsonStore.js';
import { readText } from './utils/fs.js';
import { createLogger } from './utils/logger.js';
import { RateLimiter } from './utils/rateLimiter.js';

async function main() {
  const config = loadConfig();
  validateRuntimeConfig(config);

  const logger = createLogger(config);
  const store = new JsonStore(config, logger);
  await store.load();

  const [richSystemPrompt, bridgeMasterPrompt] = await Promise.all([
    readText(config.paths.richPromptFile),
    readText(config.paths.bridgePromptFile)
  ]);

  const provider = createAIProvider(config, logger);
  const promptBuilder = new PromptBuilder();
  const planValidator = new PlanValidator();

  const services = {};
  services.guildSettingsService = new GuildSettingsService({ store, config });
  services.conversationService = new ConversationService({ store, config });
  services.guildSnapshotService = new GuildSnapshotService(logger);
  services.pendingPlanService = new PendingPlanService({ store, config });
  services.templateService = new TemplateService();
  services.actionExecutor = new ActionExecutor({ config, logger });
  services.rateLimiter = new RateLimiter({
    windowMs: 15_000,
    maxRequests: 6
  });
  services.bridgePackageService = new BridgePackageService({
    promptBuilder,
    bridgeMasterPrompt,
    logger
  });
  services.interpreterService = provider
    ? new InterpreterService({
        provider,
        promptBuilder,
        planValidator,
        richSystemPrompt,
        logger
      })
    : null;
  services.serverArchitectService = new ServerArchitectService({
    guildSettingsService: services.guildSettingsService,
    guildSnapshotService: services.guildSnapshotService,
    conversationService: services.conversationService,
    interpreterService: services.interpreterService,
    bridgePackageService: services.bridgePackageService,
    planValidator,
    pendingPlanService: services.pendingPlanService,
    actionExecutor: services.actionExecutor,
    templateService: services.templateService,
    logger
  });

  const client = new Client(CLIENT_OPTIONS);
  const interactionHandler = new InteractionHandler({ config, services, logger });
  const messageHandler = new MessageHandler({ config, services, logger });

  client.once(Events.ClientReady, async (readyClient) => {
    logger.info(`Logged in as ${readyClient.user.tag}`);
    readyClient.user.setPresence({
      activities: [{ name: '/setup | !help | Kuruma + Letifer' }],
      status: 'online'
    });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      await interactionHandler.handle(interaction);
    } catch (error) {
      logger.error('Unhandled interaction error.', {
        error: error.message
      });
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    try {
      await messageHandler.handle(message);
    } catch (error) {
      logger.error('Unhandled message error.', {
        error: error.message
      });
    }
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down.`);
    client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection.', { error: error?.message || String(error) });
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception.', { error: error.message });
  });

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
