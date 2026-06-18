// A per-page-load record of values the app actually read, keyed by label (latest
// wins). The userscript re-runs on every full navigation, so this map is
// naturally scoped to the current load; nothing is persisted (that's the log's
// job). It backs the Diagnostics view, which shows what the tools observed rather
// than re-deriving a parallel snapshot.
const readings = new Map<string, string>();

// A scalar's readable form. Objects expand into separate rows (see record), so
// this only fields primitives, null, and arrays (shown as a count).
function scalar(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

// Record a value under a label and return it, for inline use at a read site. An
// object expands into one row per field ("accused id", "accused name", ...) so
// compound readings stay scannable; undefined fields are dropped. Pass `format`
// when only the callsite knows the meaningful shape (e.g. tags -> their names).
export function record<T>(
  label: string,
  value: T,
  format?: (value: T) => unknown,
): T {
  const shown = format ? format(value) : value;
  if (shown !== null && typeof shown === 'object' && !Array.isArray(shown)) {
    for (const [key, field] of Object.entries(
      shown as Record<string, unknown>,
    )) {
      if (field !== undefined) readings.set(`${label} ${key}`, scalar(field));
    }
  } else {
    readings.set(label, scalar(shown));
  }
  return value;
}

// Wrap a reader so every call records its result under `label`. The label lives
// with the reader (declared once), and any caller (a tool's `when`, a run, or
// startup) populates diagnostics just by reading.
export function probe<A extends unknown[], R>(
  label: string,
  read: (...args: A) => R,
  format?: (value: R) => unknown,
): (...args: A) => R {
  return (...args: A): R => record(label, read(...args), format);
}

export function diagReadings(): Array<[string, string]> {
  return [...readings.entries()];
}
