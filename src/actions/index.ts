import type { Action } from '../core/actions/types';
import { userActivity } from './activity';
import { burnable } from './burnable';
import { convertToBan, convertToFeedback } from './convert';
import { copy } from './copy';
import { createFeedback } from './feedback';
import { diagnostics } from './diagnostics';
import { logs } from './logs';
import { mode } from './mode';
import { postActions } from './post';
import { settingsActions } from './settings';
import { ticketActions } from './ticket';
import { fixUpload } from './upload';
import { viewUser } from './viewUser';

export const allActions: Action[] = [
  copy,
  ...postActions,
  ...ticketActions,
  createFeedback,
  convertToBan,
  convertToFeedback,
  viewUser,
  userActivity,
  burnable,
  ...settingsActions,
  mode,
  fixUpload,
  logs,
  diagnostics,
];
