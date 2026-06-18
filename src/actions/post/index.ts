import type { Action } from '../../core/actions/types';
import { burntComments } from './burntComments';
import { deletePostGroup } from './delete';
import { flipRelationship } from './flip';
import { searchBy, searchPendingBy } from './searchBy';
import { searchPosts } from './searchPosts';
import { undelete, undeleteAndUnapprove } from './undelete';

export const postActions: Action[] = [
  searchPosts,
  searchBy,
  searchPendingBy,
  deletePostGroup,
  flipRelationship,
  undelete,
  undeleteAndUnapprove,
  burntComments,
];
