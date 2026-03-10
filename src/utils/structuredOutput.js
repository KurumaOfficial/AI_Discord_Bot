// Authors: Kuruma, Letifer

import { BRIDGE_HEADER } from '../config/constants.js';
import { stripCodeFences } from './text.js';

function safeJsonParse(candidate) {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function findBalancedJson(text) {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function extractJsonObject(text) {
  const direct = safeJsonParse(String(text ?? '').trim());
  if (direct) {
    return direct;
  }

  const fencedMatch = String(text ?? '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    const parsed = safeJsonParse(stripCodeFences(fencedMatch[0]));
    if (parsed) {
      return parsed;
    }
  }

  const balanced = findBalancedJson(String(text ?? ''));
  if (balanced) {
    const parsed = safeJsonParse(balanced);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function extractBridgePayload(text) {
  const raw = String(text ?? '').trim();
  if (!raw.includes(BRIDGE_HEADER)) {
    return null;
  }

  return extractJsonObject(raw);
}
