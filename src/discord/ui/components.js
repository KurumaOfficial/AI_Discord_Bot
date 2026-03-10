// Authors: Kuruma, Letifer

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { BUTTON_CUSTOM_IDS, MODAL_CUSTOM_IDS } from '../../config/constants.js';

export function buildPlanButtons(planId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_CUSTOM_IDS.APPLY_PLAN}:${planId}`)
      .setLabel('Apply Plan')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_CUSTOM_IDS.SHOW_PLAN}:${planId}`)
      .setLabel('Show JSON')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_CUSTOM_IDS.CANCEL_PLAN}:${planId}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger)
  );
}

export function buildBridgeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_CUSTOM_IDS.OPEN_BRIDGE_MODAL)
      .setLabel('Paste Bridge Reply')
      .setStyle(ButtonStyle.Primary)
  );
}

export function buildBridgeModal() {
  const input = new TextInputBuilder()
    .setCustomId('bridge_payload')
    .setLabel('Paste KURUMA_PLAN_V1 payload')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('KURUMA_PLAN_V1 ...')
    .setMaxLength(4000);

  return new ModalBuilder()
    .setCustomId(MODAL_CUSTOM_IDS.BRIDGE_APPLY)
    .setTitle('Apply Bridge Reply')
    .addComponents(new ActionRowBuilder().addComponents(input));
}
