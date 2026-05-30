import type { Action } from '../../core/actions/types';
import { viewAccusedFeedback } from './accusedFeedback';
import { viewCommentInContext, viewForumPostInContext } from './viewInContext';

export const ticketActions: Action[] = [
  viewCommentInContext,
  viewForumPostInContext,
  viewAccusedFeedback,
];
