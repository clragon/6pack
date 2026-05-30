const readings = new Map<string, string>();

function scalar(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

export function record<T>(
  label: string,
  value: T,
  format?: (value: T) => unknown,
): T {
  const shown = format ? format(value) : value;
  if (shown !== null && typeof shown === 'object' && !Array.isArray(shown)) {
    for (const [key, field] of Object.entries(shown as Record<string, unknown>)) {
      if (field !== undefined) readings.set(`${label} ${key}`, scalar(field));
    }
  } else {
    readings.set(label, scalar(shown));
  }
  return value;
}

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
