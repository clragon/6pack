import type { SixpackAddon } from '../../core/addons/types';
import type { SettingsApi } from '../../core/settings';
import { deepActiveElement, isEditableElement } from '../../core/palette/focus';
import HOVER_ZOOM_CSS from './styles.css?inline';

const THUMB = 'article.thumbnail[data-id]';
const VIDEO_EXT = new Set(['webm', 'mp4']);
const MARGIN = 50;
const EDGE = 10;

const AUDIO = 'hover-zoom.audio';

interface Thumb {
  el: HTMLElement;
  width: number;
  height: number;
  ext: string;
  size: number;
  flags: string[];
  favorited: boolean;
  sample: string;
  preview: string;
  original: string;
}

function readThumb(el: HTMLElement): Thumb | null {
  const data = el.dataset;
  const width = Number(data.width);
  const height = Number(data.height);
  const sample = data.sampleUrl || data.fileUrl;
  if (!width || !height || !sample) return null;
  // e621 renders the thumbnail as a picture with a webp source, so currentSrc
  // names the cached file rather than data-preview-url.
  const shown = el.querySelector('img')?.currentSrc;
  return {
    el,
    width,
    height,
    ext: data.fileExt ?? '',
    size: Number(data.size) || 0,
    flags: (data.flags ?? '').split(/\s+/),
    favorited: data.isFavorited === 'true',
    sample,
    preview: shown || data.previewWebp || data.previewUrl || '',
    original: data.fileUrl || sample,
  };
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function fit(thumb: Thumb): { width: number; height: number } {
  const ratio = thumb.height / thumb.width;
  let width = Math.min(thumb.width, window.innerWidth / 2 - MARGIN);
  let height = width * ratio;
  const tallest = window.innerHeight * 0.75;
  if (height > tallest) {
    height = tallest;
    width = height / ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function mount(settings: SettingsApi): () => void {
  const container = document.querySelector<HTMLElement>(
    'section.posts-container',
  );
  if (!container) return () => {};

  const style = document.createElement('style');
  style.textContent = HOVER_ZOOM_CSS;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'sp-hz';
  const image = document.createElement('img');
  const video = document.createElement('video');
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  const desc = document.createElement('article');
  // e621 styles .thm-desc and the data-is-favorited star under
  // article.thumbnail.
  desc.className = 'thumbnail';
  panel.append(image, video, desc);
  document.body.appendChild(panel);

  let hovered: HTMLElement | null = null;
  let shown: Thumb | null = null;
  let shift = false;
  let x = 0;
  let y = 0;
  let panelWidth = 0;
  let panelHeight = 0;
  let frame = 0;

  const align = (): void => {
    const left =
      x < window.innerWidth / 2 ? x + MARGIN : x - panelWidth - MARGIN;
    const top = Math.min(
      Math.max(y - panelHeight / 2, EDGE),
      Math.max(window.innerHeight - panelHeight - EDGE, EDGE),
    );
    panel.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };

  const schedule = (): void => {
    if (frame || !shown) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      align();
    });
  };

  const onMove = (event: MouseEvent): void => {
    x = event.clientX;
    y = event.clientY;
    schedule();
  };

  const hide = (): void => {
    if (!shown) return;
    const link = shown.el.querySelector<HTMLElement>('a.thm-link');
    if (link?.dataset.spHzText) {
      link.dataset.hoverText = link.dataset.spHzText;
      delete link.dataset.spHzText;
    }
    shown = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    panel.dataset.open = 'false';
    image.removeAttribute('src');
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
    desc.textContent = '';
  };

  const show = (): void => {
    if (shown || !hovered) return;
    const thumb = readThumb(hovered);
    if (!thumb || thumb.ext === 'swf' || thumb.flags.includes('deleted'))
      return;
    shown = thumb;

    const link = thumb.el.querySelector<HTMLElement>('a.thm-link');
    if (link?.dataset.hoverText) {
      link.dataset.spHzText = link.dataset.hoverText;
      delete link.dataset.hoverText;
    }

    const { width, height } = fit(thumb);
    const playing = VIDEO_EXT.has(thumb.ext);
    const media = playing ? video : image;
    const idle = playing ? image : video;
    idle.style.display = 'none';
    media.style.display = '';
    media.style.width = `${width}px`;
    media.style.height = `${height}px`;

    if (playing) {
      video.muted = !settings.get(AUDIO);
      video.poster = thumb.preview;
      video.src = thumb.original;
      // A modifier key press grants no user activation, so the browser refuses
      // unmuted playback.
      void video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => {});
      });
    } else {
      image.src = thumb.preview || thumb.sample;
      if (thumb.preview) {
        const upgrade = new Image();
        upgrade.addEventListener(
          'load',
          () => {
            if (shown === thumb) image.src = thumb.sample;
          },
          { once: true },
        );
        upgrade.src = thumb.sample;
      }
    }

    const row = thumb.el.querySelector('.thm-desc')?.cloneNode(true);
    if (row instanceof HTMLElement) {
      const facts = [
        `${thumb.width} × ${thumb.height}`,
        formatSize(thumb.size),
      ].filter(Boolean);
      const metrics = row.querySelector('.thm-desc-a') ?? row;
      for (const fact of facts) {
        const span = document.createElement('span');
        span.className = 'thm-desc-m';
        span.textContent = fact;
        metrics.appendChild(span);
      }
      desc.appendChild(row);
    }
    desc.dataset.isFavorited = String(thumb.favorited);
    desc.style.width = `${width}px`;

    panel.dataset.open = 'true';
    const rect = panel.getBoundingClientRect();
    panelWidth = rect.width;
    panelHeight = rect.height;
    align();
  };

  const onOver = (event: MouseEvent): void => {
    x = event.clientX;
    y = event.clientY;
    const target = event.target as HTMLElement | null;
    const thumb = target?.closest<HTMLElement>(THUMB) ?? null;
    if (thumb === hovered) return;
    hovered = thumb;
    hide();
    if (shift) show();
  };

  const onLeave = (): void => {
    hovered = null;
    hide();
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Shift') return;
    if (isEditableElement(deepActiveElement())) return;
    const held = event.type === 'keydown';
    if (held === shift) return;
    shift = held;
    if (held) show();
    else hide();
  };

  const onLost = (): void => {
    shift = false;
    hide();
  };

  const onScroll = (): void => {
    hovered = null;
    hide();
  };

  container.addEventListener('mouseover', onOver);
  container.addEventListener('mouseleave', onLeave);
  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', onLost);
  window.addEventListener('contextmenu', onLost);
  document.addEventListener('scroll', onScroll, {
    capture: true,
    passive: true,
  });

  return () => {
    hide();
    container.removeEventListener('mouseover', onOver);
    container.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    document.removeEventListener('mousemove', onMove);
    window.removeEventListener('blur', onLost);
    window.removeEventListener('contextmenu', onLost);
    document.removeEventListener('scroll', onScroll, { capture: true });
    panel.remove();
    style.remove();
  };
}

export const hoverZoomAddon: SixpackAddon = {
  id: 'hover-zoom',
  name: 'Hover Zoom',
  description: 'Hold shift over a thumbnail to see the full post.',
  settings: [
    {
      key: AUDIO,
      label: 'Audio',
      description: 'Play sound in zoomed videos',
      keywords: ['hover', 'zoom', 'audio', 'sound', 'video', 'mute'],
      default: false,
    },
  ],
  setup: (ctx) => {
    let disposed = false;
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardown = mount(ctx.settings);
    });
    return () => {
      disposed = true;
      teardown?.();
    };
  },
};
