// Fetches image bytes from third-party hosts the way e621's server can't: with
// GM_xmlhttpRequest, which runs from the user's browser (their IP, no CORS) so
// hotlink-protected hosts that block e621's server-side downloader respond. The
// host allowlist mirrors the @connect grants in vite.config.ts; the userscript
// manager refuses any host not granted there, so the two lists must stay in sync.
import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

// Base domains we may download from, matched against a host or any subdomain.
// Seeded from e621ng's source alternates (app/logical/sources/alternates).
const ALLOWED_HOSTS = [
  'twimg.com',
  'pximg.net',
  'furaffinity.net',
  'facdn.net',
  'wixmp.com',
  'derpicdn.net',
  'metapix.net',
  'discordapp.com',
  'discordapp.net',
  'imgur.com',
  'sofurryfiles.com',
  'weasyl.com',
  'bsky.app',
  'e621.net',
  'e926.net',
];

export function downloadHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isDownloadable(url: string): boolean {
  const host = downloadHost(url);
  if (!host) return false;
  return ALLOWED_HOSTS.some((base) => host === base || host.endsWith(`.${base}`));
}

const FILE_PATH = /\.(png|apng|jpe?g|gif|webp|webm|mp4)$/i;
const FILE_FORMAT = /^(png|jpe?g|gif|webp)$/i;

// Whether a link points straight at a media file (vs a gallery/post page e621
// would have to resolve). Twitter et al. carry the extension in ?format=.
export function looksLikeFile(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (FILE_PATH.test(parsed.pathname)) return true;
    const format = parsed.searchParams.get('format');
    return format != null && FILE_FORMAT.test(format);
  } catch {
    return false;
  }
}

function contentType(blob: Blob, headers: string): string {
  if (blob.type) return blob.type;
  return headers.match(/content-type:\s*([^\s;]+)/i)?.[1] ?? 'application/octet-stream';
}

// A filename for the form preview; cosmetic, since e621 derives the real
// extension from the bytes. Twitter et al. carry the real format in ?format=.
function fileName(url: string, type: string): string {
  let base = 'upload';
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    if (last) base = decodeURIComponent(last);
    const format = parsed.searchParams.get('format');
    if (format && !base.includes('.')) base = `${base}.${format}`;
  } catch {
    // Keep the default name; the bytes are what matter.
  }
  if (!base.includes('.')) {
    const ext = type.split('/')[1]?.split('+')[0];
    if (ext) base = `${base}.${ext}`;
  }
  return base;
}

export function downloadFile(url: string): Promise<File> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest<'blob'>({
      method: 'GET',
      url,
      responseType: 'blob',
      timeout: 30000,
      onload: (res) => {
        if (res.status < 200 || res.status >= 300) {
          reject(new Error(`HTTP ${res.status}`));
          return;
        }
        const blob = res.response;
        const type = contentType(blob, res.responseHeaders);
        resolve(new File([blob], fileName(res.finalUrl || url, type), { type }));
      },
      onerror: () => reject(new Error('network error')),
      ontimeout: () => reject(new Error('timed out')),
    });
  });
}
