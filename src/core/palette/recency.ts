import { readJson, writeJson } from '../storage';

const KEY = 'palette.recency';

export function getRecency(): Record<string, number> {
  return readJson<Record<string, number>>(KEY, {});
}

export function recordRecency(id: string): Record<string, number> {
  const next = { ...getRecency(), [id]: Date.now() };
  writeJson(KEY, next);
  return next;
}
