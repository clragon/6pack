import type { CompareImage, GatherResult } from './types';

const VIDEO_EXT = /^(webm|mp4)$/i;
const INFO = /(\d+)\s*x\s*(\d+)\s+(\w+)\s*\(([^)]+)\)/;

interface PostFile {
  width: number;
  height: number;
  ext: string;
  size: number;
  md5: string;
  url: string | null;
}

interface PostResponse {
  post?: {
    id: number;
    file?: PostFile;
    sample?: { has: boolean; url: string | null };
  };
}

// The post's live file, straight from the API so a deleted or limited card on
// the listing never leaves us guessing. Null when the file is withheld from the
// viewer.
async function fetchCurrent(postId: number): Promise<CompareImage | null> {
  const res = await fetch(`/posts/${postId}.json`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as PostResponse;
  const file = body.post?.file;
  if (!file || !file.url) return null;
  const thumb = body.post?.sample?.url ?? file.url;
  return {
    key: `post-${postId}`,
    label: 'Current',
    full: file.url,
    thumb,
    width: file.width,
    height: file.height,
    ext: file.ext,
    size: file.size,
    href: `/posts/${postId}`,
    video: VIDEO_EXT.test(file.ext),
  };
}

function humanToBytes(text: string): number | null {
  // A video's line appends the duration ("5.2 MB, 3s"), so match the leading
  // size token rather than the whole string.
  const match = text.trim().match(/([\d.]+)\s*([KMGT]?B)\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  const scale: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };
  const factor = scale[unit];
  return factor && Number.isFinite(value) ? Math.round(value * factor) : null;
}

// The replacement's own file, not the post's. A pending card states both in one
// "Image info" field, "New:" then "Old:", so keep the New half. Every other card
// states only its own.
function readInfo(card: HTMLElement): {
  width: number;
  height: number;
  ext: string;
  size: number | null;
} | null {
  const fields = Array.from(
    card.querySelectorAll<HTMLElement>('.replacement-field'),
  );
  const field = fields.find(
    (entry) =>
      entry
        .querySelector('.replacement-field-label')
        ?.textContent?.trim()
        .toLowerCase() === 'image info',
  );
  const text =
    field?.querySelector('.replacement-field-value')?.textContent ?? '';
  const start = text.search(/new:/i);
  const old = text.search(/old:/i);
  const own =
    start >= 0 ? text.slice(start, old > start ? old : undefined) : text;
  const match = own.match(INFO);
  if (!match) return null;
  return {
    width: Number(match[1]),
    height: Number(match[2]),
    ext: match[3],
    size: humanToBytes(match[4]),
  };
}

// Null when the card yields no file url. e621 renders that link for staff only,
// and the API hides the storage id its url is keyed by, so there is no second
// route to the bytes.
function readCandidate(card: HTMLElement): CompareImage | null {
  const img = card.querySelector<HTMLImageElement>('img.replacement-thumb');
  if (!img) return null;
  const full = img.closest('a')?.getAttribute('href');
  if (!full) return null;
  const thumb = img.src;
  const info = readInfo(card);
  const id = card.id.replace('replacement-', '');
  return {
    key: `replacement-${id}`,
    label: `Replacement #${id}`,
    full,
    thumb,
    width: info?.width ?? 0,
    height: info?.height ?? 0,
    ext: info?.ext ?? '',
    size: info?.size ?? null,
    href: `#${card.id}`,
    video: info ? VIDEO_EXT.test(info.ext) : false,
  };
}

// Pending replacements sort first, so the panel defaults to the version
// awaiting review. `hidden` counts the cards whose file this viewer may not see.
function readCandidates(root: ParentNode): {
  images: CompareImage[];
  hidden: number;
} {
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>('.replacement-card[id^="replacement-"]'),
  ).filter((card) => !card.classList.contains('is-current'));
  const items = cards
    .map((card) => ({ card, image: readCandidate(card) }))
    .filter((entry): entry is { card: HTMLElement; image: CompareImage } =>
      Boolean(entry.image),
    );
  items.sort((a, b) => {
    const ap = a.card.classList.contains('is-pending') ? 0 : 1;
    const bp = b.card.classList.contains('is-pending') ? 0 : 1;
    return ap - bp;
  });
  // Counted from the markup that states the permission rather than from whatever
  // readCandidate rejected, so a card e621 reshapes never reads as a hidden file.
  const hidden = cards.filter((card) => {
    const img = card.querySelector<HTMLImageElement>('img.replacement-thumb');
    return Boolean(img) && !img?.closest('a')?.getAttribute('href');
  }).length;
  return { images: items.map((entry) => entry.image), hidden };
}

export async function gather(
  postId: number,
  root: ParentNode,
): Promise<GatherResult | null> {
  const { images, hidden } = readCandidates(root);
  if (images.length === 0) return hidden > 0 ? { kind: 'hidden' } : null;
  const current = await fetchCurrent(postId);
  if (!current) return null;
  return { kind: 'ready', data: { postId, current, candidates: images } };
}
