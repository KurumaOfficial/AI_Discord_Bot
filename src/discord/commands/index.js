// Authors: Kuruma, Letifer

import { analyzeServerCommand } from './analyzeServer.js';
import { bridgeApplyCommand } from './bridgeApply.js';
import { exportStateCommand } from './exportState.js';
import { fixPermissionsCommand } from './fixPermissions.js';
import { helpCommand } from './help.js';
import { modeCommand } from './mode.js';
import { setupCommand } from './setup.js';
import { templateCommand } from './template.js';

export const commandModules = [
  helpCommand,
  modeCommand,
  setupCommand,
  templateCommand,
  analyzeServerCommand,
  fixPermissionsCommand,
  exportStateCommand,
  bridgeApplyCommand
];

export function getCommandMap() {
  return new Map(commandModules.map((command) => [command.data.name, command]));
}
