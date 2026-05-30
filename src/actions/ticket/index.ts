import type { Action } from '../../core/actions/types';
import { accusedActivity } from './accusedActivity';
import { viewAccusedFeedback } from './accusedFeedback';
import { viewCommentInContext, viewForumPostInContext } from './viewInContext';

export const ticketActions: Action[] = [
  viewCommentInContext,
  viewForumPostInContext,
  viewAccusedFeedback,
  accusedActivity,
];
