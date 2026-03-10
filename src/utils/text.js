// Authors: Kuruma, Letifer

export function truncate(value, maxLength = 1800) {
  const text = String(value ?? '');
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function toCodeBlock(value, language = '') {
  return `\`\`\`${language}\n${String(value ?? '')}\n\`\`\``;
}

export function chunkText(value, maxLength = 1800) {
  const text = String(value ?? '');
  const chunks = [];

  for (let index = 0; index < text.length; index += maxLength) {
    chunks.push(text.slice(index, index + maxLength));
  }

  return chunks.length > 0 ? chunks : [''];
}

export function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function stripCodeFences(value) {
  const text = String(value ?? '').trim();
  return text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '').trim();
}
