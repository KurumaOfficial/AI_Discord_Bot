// Authors: Kuruma, Letifer

import { truncate } from '../utils/text.js';

export function summarizeActions(actions = [], limit = 12) {
  return actions.slice(0, limit).map((action, index) => {
    const target = action.data?.name || action.data?.channelName || action.data?.roleName || '';
    const suffix = target ? ` -> ${target}` : '';
    return `${index + 1}. ${action.type}${suffix}`;
  });
}

export function formatPlanPreview(plan) {
  const lines = [
    `Summary: ${plan.summary}`,
    plan.reasoning ? `Reasoning: ${plan.reasoning}` : null,
    plan.warnings?.length ? `Warnings: ${plan.warnings.join(' | ')}` : null,
    '',
    ...summarizeActions(plan.actions)
  ].filter(Boolean);

  return truncate(lines.join('\n'), 3900);
}
