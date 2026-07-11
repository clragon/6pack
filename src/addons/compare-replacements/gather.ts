import type { CompareData, CompareImage } from './types';

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
  // e621's file_details appends the duration after a video's size, as in 5.2
  // MB, 3s.
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

function readInfo(row: HTMLElement): {
  width: number;
  height: number;
  ext: string;
  size: number | null;
} | null {
  const dds = Array.from(row.querySelectorAll<HTMLElement>('dd'));
  for (const dd of dds) {
    const text = dd.textContent ?? '';
    if (/current:/i.test(text)) continue;
    const match = text.match(INFO);
    if (match) {
      return {
        width: Number(match[1]),
        height: Number(match[2]),
        ext: match[3],
        size: humanToBytes(match[4]),
      };
    }
  }
  return null;
}

function readCandidate(row: HTMLElement): CompareImage | null {
  if (row.classList.contains('replacement-current-row')) return null;
  const img = row.querySelector<HTMLImageElement>('img.replacement-thumb');
  if (!img) return null;
  const anchor = img.closest('a');
  const thumb = img.src;
  const full = anchor?.getAttribute('href') || thumb;
  const info = readInfo(row);
  const id = row.id.replace('replacement-', '');
  return {
    key: `replacement-${id}`,
    label: `Replacement #${id}`,
    full,
    thumb,
    width: info?.width ?? 0,
    height: info?.height ?? 0,
    ext: info?.ext ?? '',
    size: info?.size ?? null,
    href: `#${row.id}`,
    video: info ? VIDEO_EXT.test(info.ext) : false,
  };
}

function readCandidates(root: ParentNode): CompareImage[] {
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>('tr[id^="replacement-"]'),
  );
  const items = rows
    .map((row) => ({ row, image: readCandidate(row) }))
    .filter((entry): entry is { row: HTMLElement; image: CompareImage } =>
      Boolean(entry.image),
    );
  items.sort((a, b) => {
    const ap = a.row.classList.contains('replacement-pending-row') ? 0 : 1;
    const bp = b.row.classList.contains('replacement-pending-row') ? 0 : 1;
    return ap - bp;
  });
  return items.map((entry) => entry.image);
}

export async function gather(
  postId: number,
  root: ParentNode,
): Promise<CompareData | null> {
  const candidates = readCandidates(root);
  if (candidates.length === 0) return null;
  const current = await fetchCurrent(postId);
  if (!current) return null;
  return { postId, current, candidates };
}
