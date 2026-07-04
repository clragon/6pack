import { readJson, writeJson } from '../../core/storage';

export interface Template {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
}

const KEY = 'sp.quick-replies.ticket';

let current = readJson<Template[]>(KEY, []);
const listeners = new Set<() => void>();

function persist(): void {
  writeJson(KEY, current);
  for (const listener of listeners) listener();
}

export function listTemplates(): Template[] {
  return current;
}

export function pinnedTemplates(): Template[] {
  return current.filter((t) => t.pinned);
}

export function addTemplate(title: string, body: string): Template {
  const template: Template = { id: crypto.randomUUID(), title, body };
  current = [...current, template];
  persist();
  return template;
}

export function updateTemplate(
  id: string,
  patch: Partial<Pick<Template, 'title' | 'body' | 'pinned'>>,
): void {
  current = current.map((t) => (t.id === id ? { ...t, ...patch } : t));
  persist();
}

export function removeTemplate(id: string): void {
  current = current.filter((t) => t.id !== id);
  persist();
}

export function moveTemplate(id: string, delta: number): void {
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

export function setTemplates(next: Template[]): void {
  current = next;
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
