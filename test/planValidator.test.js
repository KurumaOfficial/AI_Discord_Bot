// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { PlanValidator } from '../src/engine/PlanValidator.js';

test('PlanValidator parses valid plans and detects destructive actions', () => {
  const validator = new PlanValidator();
  const plan = validator.parsePlan({
    version: '1.0',
    source: 'test',
    summary: 'Delete a channel',
    reasoning: 'cleanup',
    warnings: [],
    actions: [
      {
        type: 'channel.delete',
        data: {
          channelName: 'old-channel'
        }
      }
    ]
  });

  assert.equal(plan.actions.length, 1);
  assert.equal(validator.isPlanDestructive(plan), true);
});
