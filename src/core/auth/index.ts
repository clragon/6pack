import { cookieTransport } from './cookie';
import type { Transport } from './types';

// The active transport. Callers go through this, so the implementation can
// change without touching them.
export const transport: Transport = cookieTransport;

export type { Transport };
