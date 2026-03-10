// Authors: Kuruma, Letifer

import { getTemplate } from '../engine/templates.js';

export class TemplateService {
  getTemplate(name) {
    return getTemplate(name);
  }

  buildTemplatePlan(name) {
    const template = this.getTemplate(name);
    if (!template) {
      throw new Error(`Unknown template: ${name}`);
    }

    return template.buildPlan();
  }
}
