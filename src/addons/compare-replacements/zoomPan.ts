import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
const IDENTITY = { zoom: 1, tx: 0, ty: 0 };

export interface ZoomPan {
  ref: RefObject<HTMLDivElement>;
  pos: number;
  swap: () => void;
  clip: string;
  imgStyle: { transform: string; imageRendering: 'pixelated' | 'auto' };
  onMouseDown: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onDblClick: (e: MouseEvent) => void;
}

// The clip-wipe slider's shared interaction: a 0-100 divider position, plus
// integer scroll-zoom and pan pinned to the pointer, applied to both media
// layers. `width`/`height` describe the base media so the wheel can tell image
// from letterbox and leave the black bars to scroll the page.
export function useZoomPan(
  width: number,
  height: number,
  active = true,
): ZoomPan {
  const [pos, setPos] = useState(50);
  const [view, setView] = useState(IDENTITY);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const overMedia = useCallback(
    (cx: number, cy: number, rect: DOMRect): boolean => {
      const aspect = (width || 1) / (height || 1);
      const wide = rect.width / rect.height > aspect;
      const pw = wide ? rect.height * aspect : rect.width;
      const ph = wide ? rect.height : rect.width / aspect;
      const px = wide ? (rect.width - pw) / 2 : 0;
      const py = wide ? 0 : (rect.height - ph) / 2;
      const v = viewRef.current;
      return (
        cx >= v.tx + px * v.zoom &&
        cx <= v.tx + (px + pw) * v.zoom &&
        cy >= v.ty + py * v.zoom &&
        cy <= v.ty + (py + ph) * v.zoom
      );
    },
    [width, height],
  );

  const moveTo = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) moveTo(e.clientX);
    };
    const onTouch = (e: TouchEvent) => {
      if (dragging.current && e.touches[0]) moveTo(e.touches[0].clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (!overMedia(cx, cy, rect)) return;
      e.preventDefault();
      const step = e.deltaY < 0 ? 1 : -1;
      setView((prev) => {
        const next = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, Math.round(prev.zoom) + step),
        );
        if (next === prev.zoom) return prev;
        if (next === 1) return IDENTITY;
        const ipx = (cx - prev.tx) / prev.zoom;
        const ipy = (cy - prev.ty) / prev.zoom;
        return { zoom: next, tx: cx - ipx * next, ty: cy - ipy * next };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [overMedia, active]);

  return {
    ref,
    pos,
    swap: () => setPos((p) => (p < 50 ? 100 : 0)),
    clip: `inset(0 0 0 ${pos}%)`,
    imgStyle: {
      transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.zoom})`,
      imageRendering: view.zoom > 1 ? 'pixelated' : 'auto',
    },
    onMouseDown: (e) => {
      dragging.current = true;
      moveTo(e.clientX);
    },
    onTouchStart: (e) => {
      if (!e.touches[0]) return;
      dragging.current = true;
      moveTo(e.touches[0].clientX);
    },
    onDblClick: (e) => {
      if ((e.target as HTMLElement).closest('button, a')) return;
      setView(IDENTITY);
    },
  };
}
