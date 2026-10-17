import type { SixpackAddon } from '../../core/addons/types';
import BETTER_EDITS_CSS from './styles.css?inline';

// Matches the media query width in styles.css.
const BREAKPOINT = '80rem';
const MAX_ZOOM = 12;
const ZOOM_STEP = 1.2;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function mountDom(): () => void {
  const frame = document.querySelector<HTMLElement>('#image-and-nav');
  const container = document.querySelector<HTMLElement>('#image-container');
  const image = document.querySelector('#image');
  if (!frame || !container || !image || image.tagName !== 'IMG') {
    return () => {};
  }
  const img = image as HTMLImageElement;

  const edit = document.querySelector<HTMLElement>('#edit');
  const wide = window.matchMedia(`(min-width: ${BREAKPOINT})`);
  const active = () =>
    wide.matches && !!edit && getComputedStyle(edit).display !== 'none';

  const sizeFrame = () => {
    if (!active()) {
      frame.style.height = '';
      return;
    }
    const offset = Math.round(
      frame.getBoundingClientRect().top + window.scrollY,
    );
    frame.style.height = `calc(100vh - ${offset}px - 0.5rem)`;
  };

  const original = container.dataset.fileUrl;
  const loadOriginal = () => {
    if (active() && original && img.src !== original) img.src = original;
  };

  let scale = 1;
  let tx = 0;
  let ty = 0;

  const apply = () => {
    img.style.transformOrigin = '0 0';
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    img.style.transform = '';
    img.style.cursor = '';
  };

  // RE621 swaps the post image between sample and original on click.
  const onClick = (e: Event) => {
    if (active()) e.stopPropagation();
  };
  container.addEventListener('click', onClick, true);

  const onWheel = (e: WheelEvent) => {
    if (!active()) return;
    e.preventDefault();

    const rect = img.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;

    const next = clamp(
      scale * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP),
      1,
      MAX_ZOOM,
    );
    const ratio = next / scale;
    tx -= dx * (ratio - 1);
    ty -= dy * (ratio - 1);
    scale = next;

    if (scale === 1) reset();
    else apply();
  };
  container.addEventListener('wheel', onWheel, { passive: false });

  let dragging = false;
  let startX = 0;
  let startY = 0;

  const onMouseDown = (e: MouseEvent) => {
    if (!active() || scale <= 1) return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    img.style.cursor = 'grabbing';
    e.preventDefault();
  };
  container.addEventListener('mousedown', onMouseDown);

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    apply();
  };
  window.addEventListener('mousemove', onMouseMove);

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    img.style.cursor = 'grab';
  };
  window.addEventListener('mouseup', onMouseUp);

  const onDblClick = (e: MouseEvent) => {
    if (!active()) return;
    e.preventDefault();
    reset();
  };
  container.addEventListener('dblclick', onDblClick);

  const sync = () => {
    if (active()) {
      sizeFrame();
      loadOriginal();
    } else {
      reset();
      frame.style.height = '';
    }
  };

  const onResize = () => {
    if (active()) sizeFrame();
  };

  wide.addEventListener('change', sync);
  window.addEventListener('resize', onResize);

  let observer: MutationObserver | null = null;
  if (edit) {
    observer = new MutationObserver(sync);
    observer.observe(edit, { attributes: true, attributeFilter: ['style'] });
  }
  sync();

  return () => {
    container.removeEventListener('click', onClick, true);
    container.removeEventListener('wheel', onWheel);
    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('dblclick', onDblClick);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('resize', onResize);
    wide.removeEventListener('change', sync);
    observer?.disconnect();
    reset();
    frame.style.height = '';
  };
}

export const betterEditsAddon: SixpackAddon = {
  id: 'better-edits',
  name: 'Better Edits',
  description: 'Puts the edit form next to the image.',
  when: (page) => page.kind === 'post',
  setup: (ctx) => {
    const style = document.createElement('style');
    style.id = 'better-edits';
    style.textContent = BETTER_EDITS_CSS;
    document.head.appendChild(style);

    let disposed = false;
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardown = mountDom();
    });
    return () => {
      disposed = true;
      teardown?.();
      style.remove();
    };
  },
};
