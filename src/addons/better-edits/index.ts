import type { SixpackAddon } from '../../core/addons/types';

// Parks the edit form beside the image on wide screens and adds scroll-to-zoom.

const BREAKPOINT = '80rem';
const EDIT_COLUMN = '1fr';
const MAX_ZOOM = 12;
const ZOOM_STEP = 1.2;

// e621 shows/hides #edit via inline display, so :has() leaves the page untouched
// until you edit.
const editShown = '#edit:not([style*="display: none"])';

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function mount(): () => void {
  const style = document.createElement('style');
  style.id = 'better-edits';
  style.textContent = `
    @media (min-width: ${BREAKPOINT}) {
      .post-display > .content:has(> ${editShown}) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, ${EDIT_COLUMN});
        align-items: start;
        column-gap: 1rem;
      }

      .post-display > .content:has(> ${editShown}) > * {
        grid-column: 1;
        min-width: 0;
      }

      .post-display > .content > ${editShown} {
        grid-column: 2;
        grid-row: 1 / span 99;
        align-self: start;
        position: sticky;
        top: 0.5rem;
        margin: 0;
      }

      .post-display > .content:has(> ${editShown}) > #image-and-nav {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 2rem);
      }

      /* e621 ships #image-container as fit-content; override so there's room to
         center and zoom into. */
      .post-display > .content:has(> ${editShown}) #image-container {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .post-display > .content:has(> ${editShown}) #image {
        max-width: 100%;
        max-height: 100%;
        margin: auto;
        cursor: zoom-in;
      }
    }
  `;
  document.head.appendChild(style);

  const frame = document.querySelector<HTMLElement>('#image-and-nav');
  const container = document.querySelector<HTMLElement>('#image-container');
  const image = document.querySelector('#image');
  // Videos and flash get the CSS layout but not the JS zoom.
  if (!frame || !container || !image || image.tagName !== 'IMG') {
    return () => style.remove();
  }
  const img = image as HTMLImageElement;

  const edit = document.querySelector<HTMLElement>('#edit');
  const wide = window.matchMedia(`(min-width: ${BREAKPOINT})`);
  const active = () =>
    wide.matches && !!edit && getComputedStyle(edit).display !== 'none';

  // Size the frame to the space below its own top; the header and notice rows
  // vary, so the CSS can't know the offset.
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

  // Zoom wants the full-resolution file, not the downscaled sample.
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

  // Swallow clicks while active; RE621 rigs the image to swap versions on click.
  const onClick = (e: Event) => {
    if (active()) e.stopPropagation();
  };
  container.addEventListener('click', onClick, true);

  const onWheel = (e: WheelEvent) => {
    if (!active()) return;
    e.preventDefault();

    // rect already folds in the current transform, so the pointer-to-corner
    // offset is all we need to pin that pixel under the cursor.
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
    style.remove();
  };
}

export const betterEditsAddon: SixpackAddon = {
  id: 'better-edits',
  name: 'Better Edits',
  when: (page) => page.kind === 'post',
  setup: () => mount(),
};
