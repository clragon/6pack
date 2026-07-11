import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

// Longest edge of the diff canvas. Moonshine computes its heatmap server-side
// with sharp; this runs on the page thread, so a lower cap keeps the per-pixel
// pass responsive.
const MAX_DIM = 1024;

// CIE76 (plain Lab distance) rather than Moonshine's CIEDE2000: the perceptual
// gain over raw RGB is the Lab space itself, and CIEDE2000's hue/chroma
// corrections cost ~15x per pixel, which stalls a browser thread. 2.3 is the
// just-noticeable-difference; below it recompression noise never registers.
const DE_THRESHOLD = 2.3;
const INTENSITY_SCALE = 16;

export interface DiffResult {
  url: string;
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

// labF over its whole input range (t in [0, 1] for in-gamut sRGB), tabulated so
// the hot loop swaps six Math.cbrt calls per pixel for six array reads.
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

// CIE76 distance between two sRGB pixels, both Lab conversions inlined so the hot
// loop allocates nothing per pixel.
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

// e621's static host sends no CORS headers, so a remote <img>/<video> drawn to
// canvas taints it and blocks getImageData. Pull the bytes with the userscript's
// cross-origin grant instead; the blob is same-origin and stays readable.
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

const objectUrlCache = new Map<string, Promise<string>>();

// A same-origin object URL for a media file. Replacement files carry no CORS
// header, so a <video> pointed at one can neither stream crossorigin nor feed the
// heatmap canvas; routing it through a blob does both. Cached for the page.
export function fetchObjectUrl(url: string): Promise<string> {
  const hit = objectUrlCache.get(url);
  if (hit) return hit;
  const pending = fetchBlob(url)
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => {
      objectUrlCache.delete(url);
      throw error;
    });
  objectUrlCache.set(url, pending);
  return pending;
}

// Both sources land in an identical box, aspect preserved with transparent
// letterboxing, so same-aspect rescales align pixel-for-pixel and a crop or
// aspect change reads as divergent rather than smearing the whole frame.
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

// Fit dims for the smaller of the two sources, capped to MAX_DIM.
function box(aw: number, ah: number, bw: number, bh: number): [number, number] {
  const bw2 = Math.min(aw, bw);
  const bh2 = Math.min(ah, bh);
  const scale = Math.min(1, MAX_DIM / Math.max(bw2, bh2));
  return [
    Math.max(1, Math.round(bw2 * scale)),
    Math.max(1, Math.round(bh2 * scale)),
  ];
}

// Walk two sampled buffers, paint the amber divergence overlay into `ctx`, and
// return the divergent pixel count.
function paintHeat(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
): number {
  const heat = ctx.createImageData(width, height);
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
  ctx.putImageData(heat, 0, 0);
  return divergent;
}

// Diff the current frame of two videos straight onto a display canvas, returning
// the divergent percentage. Null until both have a decoded frame.
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
  const divergent = paintHeat(pa, pb, width, height, ctx);
  return (divergent / (width * height)) * 100;
}

// Diffs are keyed by their image pair and kept for the life of the page: the
// heatmap remounts every time the mode is switched back to it, and the object
// URL each result owns is never revoked so a cache hit stays displayable.
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

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const divergent = paintHeat(a, b, width, height, ctx);

  const url = await new Promise<string>((resolve, reject) => {
    out.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error('failed to encode heatmap'));
    });
  });

  return {
    url,
    width,
    height,
    divergentPercent: (divergent / (width * height)) * 100,
    currentBytes: current.bytes,
    candidateBytes: candidate.bytes,
    currentPixels,
    candidatePixels,
  };
}
