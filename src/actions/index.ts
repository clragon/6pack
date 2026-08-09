import type { Action } from '../core/actions/types';
import { addonsActions } from './addons';
import { userActivity } from './activity';
import { convertToBan, convertToFeedback } from './convert';
import { copy } from './copy';
import { createFeedback } from './feedback';
import { diagnostics } from './diagnostics';
import { help } from './help';
import { logs } from './logs';
import { mode } from './mode';
import { postActions } from './post';
import { settingsActions } from './settings';
import { viewUser } from './viewUser';

export const allActions: Action[] = [
  copy,
  ...postActions,
  createFeedback,
  convertToBan,
  convertToFeedback,
  viewUser,
  userActivity,
  ...settingsActions,
  mode,
  ...addonsActions,
  help,
  logs,
  diagnostics,
];
