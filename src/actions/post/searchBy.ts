import type { Action } from '../../core/actions/types';
import { isApprovalsEnabled } from '../../site/approval';
import { readArtistTags, readUploaderId, readUploaderName } from '../../site/post';

function searchChildren(pending: boolean): Action[] {
  const suffix = pending ? '.pending' : '';
  const go = (tags: string) => () => {
    const full = pending ? `${tags} status:pending` : tags;
    window.location.href = `/posts?tags=${encodeURIComponent(full)}`;
  };

  const children: Action[] = [];

  const uploaderId = readUploaderId();
  if (uploaderId !== null) {
    const name = readUploaderName();
    children.push({
      id: `post.search-by.uploader${suffix}`,
      title: name ? `Uploader: ${name}` : 'Uploader',
      keywords: ['uploader', 'user', 'submitter', ...(name ? [name] : [])],
      run: go(name ? `user:${name}` : `userid:${uploaderId}`),
    });
  }

  for (const artist of readArtistTags()) {
    children.push({
      id: `post.search-by.artist${suffix}:${artist.name}`,
      title: `Artist: ${artist.label}`,
      keywords: ['artist', artist.label, artist.name],
      run: go(artist.name),
    });
  }

  return children;
}

export const searchBy: Action = {
  id: 'post.search-by',
  title: 'Search by',
  description: 'Filter the post list by a facet of this post',
  keywords: ['search', 'find', 'filter', 'by'],
  when: (page) => page.kind === 'post',
  submenu: () => searchChildren(false),
};

// Janitor variant: pending-only, surfaced above the plain search while the
// Approvals toolbar is on, and absent entirely otherwise.
export const searchPendingBy: Action = {
  id: 'post.search-pending-by',
  title: 'Search pending by',
  description: 'Filter pending posts by a facet of this one',
  keywords: ['search', 'pending', 'approve', 'queue', 'filter', 'by'],
  weight: 1,
  when: (page) => page.kind === 'post' && isApprovalsEnabled(),
  submenu: () => searchChildren(true),
};
