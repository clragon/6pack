import type { Action } from '../core/actions/types';
import { copy } from './copy';
import { diagnostics } from './diagnostics';
import { logs } from './logs';
import { mode } from './mode';
import { postActions } from './post';
import { settingsActions } from './settings';
import { ticketActions } from './ticket';

export const allActions: Action[] = [
  copy,
  ...postActions,
  ...ticketActions,
  ...settingsActions,
  mode,
  logs,
  diagnostics,
];
