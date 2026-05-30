// Readers for the post-show DOM. One concern per function so a single broken
// selector is isolated and cheap to repair when e621 changes its markup.
import { probe } from '../core/diag';

interface RawPost {
  created_at?: string;
  flags?: Record<string, boolean>;
}

// #image-container carries the full post as a data-post JSON blob (show page
// renders it with include_post). Authoritative source for status and dates.
export function readPostData(): RawPost | null {
  const raw = document
    .getElementById('image-container')
    ?.getAttribute('data-post');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RawPost;
  } catch {
    return null;
  }
}

export const isDeleted = probe('deleted', (): boolean => {
  return readPostData()?.flags?.deleted === true;
});

// A post listing context: the index (/posts) or a post show page (/posts/:id),
// both of which search posts.
export function isPostListing(): boolean {
  return /^\/posts(\/\d+)?\/?$/.test(location.pathname);
}

export function readCreatedAt(): Date | null {
  const iso = readPostData()?.created_at;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface ArtistTag {
  // Canonical name with underscores, for the tags= query.
  name: string;
  // Display form with spaces.
  label: string;
}

// Sidebar tag rows carry the canonical (URL-encoded) name in data-name and the
// category in data-category.
export const readArtistTags = probe('artist tags', (): ArtistTag[] => {
  const items = document.querySelectorAll<HTMLElement>(
    'li.tag-list-item[data-category="artist"]',
  );
  const seen = new Set<string>();
  const tags: ArtistTag[] = [];
  for (const item of items) {
    const raw = item.getAttribute('data-name');
    if (!raw) continue;
    let name: string;
    try {
      name = decodeURIComponent(raw);
    } catch {
      name = raw;
    }
    if (!name || seen.has(name)) continue;
    seen.add(name);
    tags.push({ name, label: name.replace(/_/g, ' ') });
  }
  return tags;
}, (tags) => (tags.length ? tags.map((t) => t.label).join(', ') : 'none'));

export const readUploaderId = probe('uploader id', (): number | null => {
  const raw = document
    .getElementById('image-container')
    ?.getAttribute('data-uploader-id');
  return raw ? Number(raw) : null;
});

// The "Uploader:" sidebar row links to /users/<id>; the link text is the name.
// Matched against the known uploader id so the approver link can't be picked.
export function readUploaderName(): string | null {
  const id = readUploaderId();
  if (id === null) return null;
  const link = document.querySelector<HTMLAnchorElement>(
    `.post-sidebar-info a[href="/users/${id}"]`,
  );
  const name = link?.textContent?.trim();
  return name || null;
}

// The post's parent id, if any. The edit form keeps it in a hidden field; the
// "has parent" notice (.notice-child) links to the parent as a fallback.
export const readParentId = probe('parent id', (): number | null => {
  const field = document.querySelector<HTMLInputElement>('#post_old_parent_id');
  if (field?.value && /^\d+$/.test(field.value)) return Number(field.value);
  const link = document.querySelector<HTMLAnchorElement>(
    '.notice-child a[href*="/posts/"]',
  );
  const match = link?.getAttribute('href')?.match(/\/posts\/(\d+)/);
  return match ? Number(match[1]) : null;
});

// Child post ids, from the "has children" relationship notice (.notice-parent,
// confusingly named). Excludes the current post.
export function readChildIds(): number[] {
  const notice = document.querySelector('.notice-parent');
  if (!notice) return [];
  const selfMatch = location.pathname.match(/\/posts\/(\d+)/);
  const selfId = selfMatch ? Number(selfMatch[1]) : null;
  const ids = new Set<number>();
  for (const link of notice.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/posts/"]',
  )) {
    const match = link.getAttribute('href')?.match(/\/posts\/(\d+)/);
    if (match && Number(match[1]) !== selfId) ids.add(Number(match[1]));
  }
  return [...ids];
}
