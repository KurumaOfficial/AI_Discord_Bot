// Authors: Kuruma, Letifer

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBridgePayload, extractJsonObject } from '../src/utils/structuredOutput.js';

test('extractJsonObject parses fenced json', () => {
  const payload = extractJsonObject('```json\n{"intent":"chat","assistantMessage":"ok"}\n```');
  assert.equal(payload.intent, 'chat');
  assert.equal(payload.assistantMessage, 'ok');
});

test('extractBridgePayload reads KURUMA_PLAN_V1 payload', () => {
  const raw = [
    'KURUMA_PLAN_V1',
    '```json',
    '{"intent":"plan","assistantMessage":"Ready","summary":"s","plan":{"version":"1.0","source":"bridge","summary":"Create role","reasoning":"","warnings":[],"actions":[{"type":"role.create","data":{"name":"Admin"}}]}}',
    '```'
  ].join('\n');

  const payload = extractBridgePayload(raw);
  assert.equal(payload.intent, 'plan');
  assert.equal(payload.plan.actions[0].type, 'role.create');
});
