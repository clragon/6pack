// The page the palette is running on, plus whatever resource it resolved.
// Extend with new variants as more contexts are supported.
export type PageContext =
  | { kind: 'post'; id: number }
  | { kind: 'ticket'; id: number }
  | { kind: 'unknown' };
