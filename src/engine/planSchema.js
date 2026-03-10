// Authors: Kuruma, Letifer

import { z } from 'zod';
import { PLAN_VERSION } from '../config/constants.js';

export const actionSchema = z.object({
  type: z.string().min(1),
  data: z.record(z.string(), z.any()).default({})
});

export const serverPlanSchema = z.object({
  version: z.string().default(PLAN_VERSION),
  source: z.string().default('unknown'),
  summary: z.string().default('No summary provided.'),
  reasoning: z.string().default(''),
  warnings: z.array(z.string()).default([]),
  actions: z.array(actionSchema).default([])
});

export const assistantEnvelopeSchema = z.object({
  intent: z.enum(['chat', 'question', 'plan', 'error']),
  assistantMessage: z.string().default(''),
  summary: z.string().default(''),
  needsConfirmation: z.boolean().default(true),
  followUpQuestions: z.array(z.string()).default([]),
  plan: serverPlanSchema.optional().nullable()
});
