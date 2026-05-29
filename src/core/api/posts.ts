import { transport } from '../auth';

export interface DeleteOptions {
  reason: string;
  // Transfers to the post's parent (only honored when the post has one).
  moveFavorites?: boolean;
  copyTags?: boolean;
  copySources?: boolean;
}

// Janitor reject / moderator delete. e621 wants commit="Delete" alongside the
// free-text reason.
export function deletePost(id: number, options: DeleteOptions): Promise<unknown> {
  return transport.post(`/moderator/post/posts/${id}/delete.json`, {
    commit: 'Delete',
    reason: options.reason,
    move_favorites: options.moveFavorites ?? false,
    copy_tags: options.copyTags ?? false,
    copy_sources: options.copySources ?? false,
  });
}

// Set a post's parent. e621 clears the reverse link when this would form a
// direct parent/child loop, so flipping a parent with its own child just works.
export function setParent(id: number, parentId: number): Promise<unknown> {
  return transport.put(`/posts/${id}.json`, { 'post[parent_id]': parentId });
}

// Restore a deleted post. Note: this approves it under the current user.
export function undeletePost(id: number): Promise<unknown> {
  return transport.post(`/moderator/post/posts/${id}/undelete.json`, {});
}

// Send an approved post back to pending. e621 only allows this for the approver,
// and only while the post is recent (within the unapproval window).
export function unapprovePost(id: number): Promise<unknown> {
  return transport.del('/moderator/post/approval.json', { post_id: id });
}
