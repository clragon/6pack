import { readJson, writeJson } from '../storage';

const KEY = 'sp.palette.frecency';

const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry {
  score: number;
  seen: number;
}

export type Frecency = Record<string, Entry>;

export function getFrecency(): Frecency {
  return readJson<Frecency>(KEY, {});
}

function decay(from: number, to: number): number {
  return 0.5 ** ((to - from) / HALF_LIFE_MS);
}

export function scoreFor(frecency: Frecency, id: string, now: number): number {
  const entry = frecency[id];
  return entry ? entry.score * decay(entry.seen, now) : 0;
}

export function recordUse(id: string): Frecency {
  const frecency = getFrecency();
  const now = Date.now();
  const prior = frecency[id];
  const decayed = prior ? prior.score * decay(prior.seen, now) : 0;
  const next: Frecency = {
    ...frecency,
    [id]: { score: decayed + 1, seen: now },
  };
  writeJson(KEY, next);
  return next;
}
