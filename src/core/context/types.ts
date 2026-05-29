export type PageContext =
  | { kind: 'post'; id: number }
  | { kind: 'unknown' };
