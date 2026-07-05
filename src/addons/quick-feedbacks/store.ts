import { readJson, writeJson } from '../../core/storage';
import { seedRecords } from './defaults';

export type RecordCategory = 'positive' | 'neutral' | 'negative' | 'ban';

// A saved record template: the reason to lead with, plus the rules it quotes by
// default. The compositor assembles these into the record body.
export interface RecordTemplate {
  id: string;
  title: string;
  reason: string;
  // Rule keys; each renders as a quoted Code of Conduct section.
  rules: string[];
  // Pinned templates show on the strip by default.
  pinned?: boolean;
  // Presets the feedback category when applied; unset lets the mod pick.
  category?: RecordCategory;
  // Ban outcome, used when category is 'ban': duration in days (-1 permanent).
  duration?: number;
  preventLogin?: boolean;
}

const KEY = 'sp.quick-feedbacks';

// A fresh install seeds the starter templates. An emptied list is not a fresh
// install, so deleted templates stay gone.
function load(): RecordTemplate[] {
  const stored = readJson<RecordTemplate[] | null>(KEY, null);
  if (stored !== null) return stored;
  const seeded = seedRecords();
  writeJson(KEY, seeded);
  return seeded;
}

let current = load();
const listeners = new Set<() => void>();

function persist(): void {
  writeJson(KEY, current);
  for (const listener of listeners) listener();
}

export function listRecords(): RecordTemplate[] {
  return current;
}

export function pinnedRecords(): RecordTemplate[] {
  return current.filter((t) => t.pinned);
}

export function addRecord(
  title: string,
  reason: string,
  rules: string[] = [],
): RecordTemplate {
  const template: RecordTemplate = {
    id: crypto.randomUUID(),
    title,
    reason,
    rules,
  };
  current = [...current, template];
  persist();
  return template;
}

export function updateRecord(
  id: string,
  patch: Partial<
    Pick<
      RecordTemplate,
      | 'title'
      | 'reason'
      | 'rules'
      | 'pinned'
      | 'category'
      | 'duration'
      | 'preventLogin'
    >
  >,
): void {
  current = current.map((t) => (t.id === id ? { ...t, ...patch } : t));
  persist();
}

export function removeRecord(id: string): void {
  current = current.filter((t) => t.id !== id);
  persist();
}

// Shift a template by one position; a move past either end is a no-op.
export function moveRecord(id: string, delta: number): void {
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return;
  const target = index + delta;
  if (target < 0 || target >= current.length) return;
  const next = [...current];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  current = next;
  persist();
}

export function setRecords(next: RecordTemplate[]): void {
  current = next;
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
