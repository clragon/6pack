interface RawPost {
  created_at?: string;
  flags?: Record<string, boolean>;
}

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

export function isDeleted(): boolean {
  return readPostData()?.flags?.deleted === true;
}

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
  name: string;
  label: string;
}

export function readArtistTags(): ArtistTag[] {
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
}

export function readUploaderId(): number | null {
  const raw = document
    .getElementById('image-container')
    ?.getAttribute('data-uploader-id');
  return raw ? Number(raw) : null;
}

export function readUploaderName(): string | null {
  const id = readUploaderId();
  if (id === null) return null;
  const link = document.querySelector<HTMLAnchorElement>(
    `.post-sidebar-info a[href="/users/${id}"]`,
  );
  const name = link?.textContent?.trim();
  return name || null;
}

export function readParentId(): number | null {
  const field = document.querySelector<HTMLInputElement>('#post_old_parent_id');
  if (field?.value && /^\d+$/.test(field.value)) return Number(field.value);
  const link = document.querySelector<HTMLAnchorElement>(
    '.notice-child a[href*="/posts/"]',
  );
  const match = link?.getAttribute('href')?.match(/\/posts\/(\d+)/);
  return match ? Number(match[1]) : null;
}

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
