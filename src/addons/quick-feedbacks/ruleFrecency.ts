import { readJson, writeJson } from '../../core/storage';

// Frecency ranking for rules (frequency with recency decay), the same shape the
// palette uses. Seeded once from observed aggregate usage so a fresh install ranks
// sensibly, then the mod's own picks decay past the prior and take over.
const KEY = 'sp.quick-feedbacks.rule-frecency';
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry {
  score: number;
  seen: number;
}
type Store = Record<string, Entry>;

// A recent sample of user feedbacks, section counts scaled down so a handful of
// personal uses can overtake the prior.
const SEED: Record<string, number> = {
  tagging: 10.5,
  disruptive: 8.9,
  inappropriate: 7.9,
  blacklist: 6.1,
  posting: 4.6,
  banevasion: 2.6,
  roleplay: 2,
  underage: 1.7,
  hatred: 1.6,
  sitetools: 1.6,
  spamming: 1.6,
  identity: 1.1,
  harassment: 1.1,
  plagiarism: 0.4,
  extremecontent: 0.1,
  noteabuse: 0.1,
};

const decay = (from: number, to: number): number =>
  0.5 ** ((to - from) / HALF_LIFE_MS);

function load(): Store {
  const stored = readJson<Store | null>(KEY, null);
  if (stored !== null) return stored;
  const now = Date.now();
  const seeded: Store = {};
  for (const [key, score] of Object.entries(SEED))
    seeded[key] = { score, seen: now };
  writeJson(KEY, seeded);
  return seeded;
}

export function recordRuleUse(keys: string[]): void {
  const store = load();
  const now = Date.now();
  for (const key of keys) {
    const prior = store[key];
    const decayed = prior ? prior.score * decay(prior.seen, now) : 0;
    store[key] = { score: decayed + 1, seen: now };
  }
  writeJson(KEY, store);
}

// The given keys ranked most-used first, by decayed score.
export function rankRules(keys: string[]): string[] {
  const store = load();
  const now = Date.now();
  const score = (key: string): number => {
    const entry = store[key];
    return entry ? entry.score * decay(entry.seen, now) : 0;
  };
  return [...keys].sort((a, b) => score(b) - score(a));
}
