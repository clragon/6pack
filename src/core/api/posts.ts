import { transport } from '../auth';

export interface DeleteOptions {
  reason: string;
  moveFavorites?: boolean;
  copyTags?: boolean;
  copySources?: boolean;
}

export function deletePost(
  id: number,
  options: DeleteOptions,
): Promise<unknown> {
  return transport.post(`/moderator/post/posts/${id}/delete.json`, {
    // Staff::Post::PostsController#delete in e621ng acts only when commit
    // equals Delete.
    commit: 'Delete',
    reason: options.reason,
    move_favorites: options.moveFavorites ?? false,
    copy_tags: options.copyTags ?? false,
    copy_sources: options.copySources ?? false,
  });
}

// Post#remove_parent_loops in e621ng clears a parent that points back at this
// post, so swapping a parent with its child takes one call.
export function setParent(id: number, parentId: number): Promise<unknown> {
  return transport.put(`/posts/${id}.json`, { 'post[parent_id]': parentId });
}

// Post#undelete! in e621ng also approves the post under the current user.
export function undeletePost(id: number): Promise<unknown> {
  return transport.post(`/moderator/post/posts/${id}/undelete.json`, {});
}

// Post#is_unapprovable? in e621ng allows only the approver, and only inside
// Danbooru.config.unapproved_post_deletion_window.
export function unapprovePost(id: number): Promise<unknown> {
  return transport.del('/moderator/post/approval.json', { post_id: id });
}
