import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

const MAX_DIM = 1024;

// 2.3 is the just noticeable difference for a CIE76 delta E.
const DE_THRESHOLD = 2.3;
const INTENSITY_SCALE = 16;

export interface DiffResult {
  heat: ImageData;
  width: number;
  height: number;
  divergentPercent: number;
  currentBytes: number;
  candidateBytes: number;
  currentPixels: number;
  candidatePixels: number;
}

interface Fetched {
  bitmap: ImageBitmap;
  bytes: number;
}

const SRGB_TO_LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const LAB_STEPS = 2048;
const LAB_LUT = new Float64Array(LAB_STEPS + 1);
for (let i = 0; i <= LAB_STEPS; i++) {
  const t = i / LAB_STEPS;
  LAB_LUT[i] = t > 0.008856451679 ? Math.cbrt(t) : 7.787037037 * t + 16 / 116;
}

function labF(t: number): number {
  if (t <= 0) return LAB_LUT[0]!;
  if (t >= 1) return LAB_LUT[LAB_STEPS]!;
  return LAB_LUT[(t * LAB_STEPS) | 0]!;
}

function deltaE(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const R1 = SRGB_TO_LINEAR[r1]!;
  const G1 = SRGB_TO_LINEAR[g1]!;
  const B1 = SRGB_TO_LINEAR[b1]!;
  const fx1 = labF(
    (R1 * 0.4124564 + G1 * 0.3575761 + B1 * 0.1804375) / 0.95047,
  );
  const fy1 = labF(R1 * 0.2126729 + G1 * 0.7151522 + B1 * 0.072175);
  const fz1 = labF((R1 * 0.0193339 + G1 * 0.119192 + B1 * 0.9503041) / 1.08883);
  const L1 = 116 * fy1 - 16;
  const a1 = 500 * (fx1 - fy1);
  const bb1 = 200 * (fy1 - fz1);

  const R2 = SRGB_TO_LINEAR[r2]!;
  const G2 = SRGB_TO_LINEAR[g2]!;
  const B2 = SRGB_TO_LINEAR[b2]!;
  const fx2 = labF(
    (R2 * 0.4124564 + G2 * 0.3575761 + B2 * 0.1804375) / 0.95047,
  );
  const fy2 = labF(R2 * 0.2126729 + G2 * 0.7151522 + B2 * 0.072175);
  const fz2 = labF((R2 * 0.0193339 + G2 * 0.119192 + B2 * 0.9503041) / 1.08883);
  const L2 = 116 * fy2 - 16;
  const a2 = 500 * (fx2 - fy2);
  const bb2 = 200 * (fy2 - fz2);

  const dL = L1 - L2;
  const da = a1 - a2;
  const db = bb1 - bb2;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// static1.e621.net sends no CORS headers, so a canvas drawn from its img or
// video is tainted. GM_xmlhttpRequest fetches under the cross origin grant.
function fetchBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest<'blob'>({
      method: 'GET',
      url,
      responseType: 'blob',
      timeout: 30000,
      onload: (res) =>
        res.status >= 200 && res.status < 300
          ? resolve(res.response)
          : reject(new Error(`HTTP ${res.status}`)),
      onerror: () => reject(new Error('network error')),
      ontimeout: () => reject(new Error('timed out')),
    });
  });
}

let blobMedia: Promise<boolean> | null = null;
function blobMediaAllowed(): Promise<boolean> {
  if (blobMedia) return blobMedia;
  blobMedia = new Promise<boolean>((resolve) => {
    let refused = false;
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (
        event.effectiveDirective === 'media-src' &&
        event.blockedURI.startsWith('blob')
      ) {
        refused = true;
      }
    };
    document.addEventListener('securitypolicyviolation', onViolation);
    const probe = document.createElement('video');
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(8)], { type: 'video/mp4' }),
    );
    const settle = () => {
      document.removeEventListener('securitypolicyviolation', onViolation);
      URL.revokeObjectURL(url);
      resolve(!refused);
    };
    probe.addEventListener('error', () => setTimeout(settle, 250), {
      once: true,
    });
    setTimeout(settle, 3000);
    probe.src = url;
  });
  return blobMedia;
}

const mediaPairCache = new Map<string, Promise<[string, string]>>();

// Chrome refuses a blob: source under e621's media-src directive, while Firefox
// taints a canvas drawn from the remote file, so the route differs.
export function resolveMediaPair(
  first: string,
  second: string,
): Promise<[string, string]> {
  const key = `${first}\n${second}`;
  const hit = mediaPairCache.get(key);
  if (hit) return hit;
  const pending = blobMediaAllowed()
    .then(async (allowed): Promise<[string, string]> => {
      if (!allowed) return [first, second];
      const [a, b] = await Promise.all([fetchBlob(first), fetchBlob(second)]);
      return [URL.createObjectURL(a), URL.createObjectURL(b)];
    })
    .catch((): [string, string] => {
      mediaPairCache.delete(key);
      return [first, second];
    });
  mediaPairCache.set(key, pending);
  return pending;
}

function fetchImage(url: string): Promise<Fetched> {
  return fetchBlob(url).then((blob) =>
    createImageBitmap(blob).then(
      (bitmap) => ({ bitmap, bytes: blob.size }),
      () => {
        throw new Error(`could not decode ${blob.type || 'image'}`);
      },
    ),
  );
}

function sampleContain(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  width: number,
  height: number,
): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no 2d context');
  const scale = Math.min(width / sw, height / sh);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  ctx.drawImage(
    source,
    Math.floor((width - w) / 2),
    Math.floor((height - h) / 2),
    w,
    h,
  );
  return ctx.getImageData(0, 0, width, height).data;
}

function box(aw: number, ah: number, bw: number, bh: number): [number, number] {
  const bw2 = Math.min(aw, bw);
  const bh2 = Math.min(ah, bh);
  const scale = Math.min(1, MAX_DIM / Math.max(bw2, bh2));
  return [
    Math.max(1, Math.round(bw2 * scale)),
    Math.max(1, Math.round(bh2 * scale)),
  ];
}

function buildHeat(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  width: number,
  height: number,
): { heat: ImageData; divergent: number } {
  const heat = new ImageData(width, height);
  const heatData = heat.data;
  let divergent = 0;
  for (let i = 0; i < a.length; i += 4) {
    const aAlpha = a[i + 3];
    const bAlpha = b[i + 3];
    if (aAlpha === 0 && bAlpha === 0) continue;

    let intensity = -1;
    if (Math.abs(aAlpha - bAlpha) > 128) {
      intensity = 255;
    } else if (
      a[i] !== b[i] ||
      a[i + 1] !== b[i + 1] ||
      a[i + 2] !== b[i + 2]
    ) {
      const de = deltaE(a[i], a[i + 1], a[i + 2], b[i], b[i + 1], b[i + 2]);
      if (de > DE_THRESHOLD) {
        intensity = Math.min(
          255,
          Math.floor((de - DE_THRESHOLD) * INTENSITY_SCALE),
        );
      }
    }

    if (intensity >= 0) {
      divergent++;
      heatData[i] = 231;
      heatData[i + 1] = Math.max(60, 132 - Math.floor(intensity / 3));
      heatData[i + 2] = 75;
      heatData[i + 3] = Math.min(230, 90 + intensity);
    }
  }
  return { heat, divergent };
}

export function diffFrame(
  a: HTMLVideoElement,
  b: HTMLVideoElement,
  out: HTMLCanvasElement,
): number | null {
  if (!a.videoWidth || !a.videoHeight || !b.videoWidth || !b.videoHeight) {
    return null;
  }
  const [width, height] = box(
    a.videoWidth,
    a.videoHeight,
    b.videoWidth,
    b.videoHeight,
  );
  const pa = sampleContain(a, a.videoWidth, a.videoHeight, width, height);
  const pb = sampleContain(b, b.videoWidth, b.videoHeight, width, height);
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  const { heat, divergent } = buildHeat(pa, pb, width, height);
  ctx.putImageData(heat, 0, 0);
  return (divergent / (width * height)) * 100;
}

const cache = new Map<string, Promise<DiffResult>>();

export function computeDiff(
  currentUrl: string,
  candidateUrl: string,
): Promise<DiffResult> {
  const key = `${currentUrl}\n${candidateUrl}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = computeUncached(currentUrl, candidateUrl).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

async function computeUncached(
  currentUrl: string,
  candidateUrl: string,
): Promise<DiffResult> {
  const [current, candidate] = await Promise.all([
    fetchImage(currentUrl),
    fetchImage(candidateUrl),
  ]);

  const currentPixels = current.bitmap.width * current.bitmap.height;
  const candidatePixels = candidate.bitmap.width * candidate.bitmap.height;

  const [width, height] = box(
    current.bitmap.width,
    current.bitmap.height,
    candidate.bitmap.width,
    candidate.bitmap.height,
  );

  const a = sampleContain(
    current.bitmap,
    current.bitmap.width,
    current.bitmap.height,
    width,
    height,
  );
  const b = sampleContain(
    candidate.bitmap,
    candidate.bitmap.width,
    candidate.bitmap.height,
    width,
    height,
  );
  current.bitmap.close();
  candidate.bitmap.close();

  const { heat, divergent } = buildHeat(a, b, width, height);

  return {
    heat,
    width,
    height,
    divergentPercent: (divergent / (width * height)) * 100,
    currentBytes: current.bytes,
    candidateBytes: candidate.bytes,
    currentPixels,
    candidatePixels,
  };
}
