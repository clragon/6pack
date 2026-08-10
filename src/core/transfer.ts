export function exportJson(slug: string, value: unknown): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `6pack-${slug}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importJson<T>(
  revive: (value: Record<string, unknown>) => T | null,
  apply: (items: T[]) => void,
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    void input.files?.[0]?.text().then((text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }
      if (!Array.isArray(parsed)) return;
      const incoming = parsed
        .filter(
          (value): value is Record<string, unknown> =>
            !!value && typeof value === 'object',
        )
        .map(revive)
        .filter((entry): entry is T => entry !== null);
      if (incoming.length) apply(incoming);
    });
  });
  input.click();
}
