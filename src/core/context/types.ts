export type PageContext =
  | { kind: 'post'; id: number }
  | { kind: 'ticket'; id: number }
  | { kind: 'user'; id: number }
  | { kind: 'userFeedbacks'; userId: number | null }
  | { kind: 'upload' }
  | { kind: 'unknown' };
