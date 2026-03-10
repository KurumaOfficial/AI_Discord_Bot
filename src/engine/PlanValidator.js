// Authors: Kuruma, Letifer

import { DESTRUCTIVE_ACTION_TYPES } from '../config/constants.js';
import { assistantEnvelopeSchema, serverPlanSchema } from './planSchema.js';

export class PlanValidator {
  parsePlan(payload) {
    return serverPlanSchema.parse(payload);
  }

  parseAssistantEnvelope(payload) {
    return assistantEnvelopeSchema.parse(payload);
  }

  isPlanDestructive(plan) {
    return plan.actions.some((action) => DESTRUCTIVE_ACTION_TYPES.has(action.type));
  }
}
