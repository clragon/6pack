import type { Action } from '../../core/actions/types';
import { accusedActivity } from './accusedActivity';
import { viewCommentInContext, viewForumPostInContext } from './viewInContext';

export const ticketActions: Action[] = [
  viewCommentInContext,
  viewForumPostInContext,
  accusedActivity,
];
