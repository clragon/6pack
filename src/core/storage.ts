// JSON wrapper over localStorage (per-origin, shared across all e621 pages).
// Degrades to the fallback so a parse error or unavailable store never breaks
// the palette. localStorage works in any context, so dev injection doesn't need
// the userscript value store.
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / availability errors
  }
}
