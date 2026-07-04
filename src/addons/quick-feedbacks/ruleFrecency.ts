import { readJson, writeJson } from '../../core/storage';

const KEY = 'quick-feedbacks.rule-frecency';
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000;

interface Entry {
  score: number;
  seen: number;
}
type Store = Record<string, Entry>;

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

export function rankRules(keys: string[]): string[] {
  const store = load();
  const now = Date.now();
  const score = (key: string): number => {
    const entry = store[key];
    return entry ? entry.score * decay(entry.seen, now) : 0;
  };
  return [...keys].sort((a, b) => score(b) - score(a));
}
