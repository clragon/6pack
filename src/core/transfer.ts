// A manager's list, handed to and taken from the user's filesystem as JSON.
// Downloads are named `6pack-<slug>.json`, where the slug is the add-on id plus
// whatever distinguishes one of its lists from another (`quick-replies-dmail`),
// so a file in a downloads folder still says where it belongs.

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

// Reads a picked file and hands back the entries `revive` accepted, dropping
// anything it rejects. A file that is not a JSON array yields nothing, so a
// mistaken pick leaves the list alone rather than emptying it.
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
