// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { TemplateService } from '../src/services/TemplateService.js';

test('TemplateService builds the gaming template', () => {
  const service = new TemplateService();
  const plan = service.buildTemplatePlan('gaming');
  assert.equal(plan.source, 'template');
  assert.ok(plan.actions.some((action) => action.type === 'role.create'));
  assert.ok(plan.actions.some((action) => action.type === 'channel.create'));
});
