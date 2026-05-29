import type { Action } from '../../core/actions/types';
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
];
