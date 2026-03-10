// Authors: Kuruma, Letifer

import { REST, Routes } from 'discord.js';
import { loadConfig, validateDeployConfig } from './config/loadConfig.js';
import { commandModules } from './discord/commands/index.js';

async function main() {
  const config = loadConfig();
  validateDeployConfig(config);

  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const commands = commandModules.map((command) => command.data.toJSON());

  if (config.commandGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.commandGuildId),
      {
        body: commands
      }
    );
    console.log(`Registered ${commands.length} guild command(s) for ${config.commandGuildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands
  });
  console.log(`Registered ${commands.length} global command(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
