export type PageContext =
  | { kind: 'post'; id: number }
  | { kind: 'ticket'; id: number }
  | { kind: 'unknown' };
