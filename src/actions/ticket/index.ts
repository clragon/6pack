import type { Action } from '../../core/actions/types';
import { viewCommentInContext, viewForumPostInContext } from './viewInContext';

export const ticketActions: Action[] = [
  viewCommentInContext,
  viewForumPostInContext,
];
