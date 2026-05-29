import { cookieTransport } from './cookie';
import type { Transport } from './types';

export const transport: Transport = cookieTransport;

export type { Transport };
