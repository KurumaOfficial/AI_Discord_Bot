// Authors: Kuruma, Letifer

import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

export async function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  const tempFile = `${filePath}.tmp`;
  await ensureDirectory(dir);
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
  await fs.rename(tempFile, filePath);
}

export async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}
