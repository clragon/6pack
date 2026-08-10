import { readJson, writeJson } from '../storage';

const KEY = 'sp.core.palette.frecency';

// Half-life of a single use's contribution. Within a session, decay over minutes
// is negligible, so ranking is effectively by frequency (a one-off can't jump a
// tool you use often); across days, unused tools fade so they stop crowding the
// top. Tunable.
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry {
  // Accumulated, decayed use count as of `seen`.
  score: number;
  // When `score` was last brought up to date.
  seen: number;
}

export type Frecency = Record<string, Entry>;

export function getFrecency(): Frecency {
  return readJson<Frecency>(KEY, {});
}

function decay(from: number, to: number): number {
  return 0.5 ** ((to - from) / HALF_LIFE_MS);
}

// The id's score decayed to `now`. Zero when never used.
export function scoreFor(frecency: Frecency, id: string, now: number): number {
  const entry = frecency[id];
  return entry ? entry.score * decay(entry.seen, now) : 0;
}

// Record one use: decay the prior score up to now, then add one.
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
