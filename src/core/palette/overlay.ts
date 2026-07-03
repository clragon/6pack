import { useEffect } from 'preact/hooks';

// Shared modal-overlay behaviour: freeze page scroll and contain focus.
// Ref-counted, so an overlay opened over another engages once.

let count = 0;
let restore: (() => void) | null = null;

function engage(keep: Element | null): void {
  const scroller = (document.scrollingElement ??
    document.documentElement) as HTMLElement;
  const top = scroller.scrollTop;
  const left = scroller.scrollLeft;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = scroller.style.overflow;
  const prevPadding = scroller.style.paddingRight;
  // Hide the scroller's overflow so it can't scroll; compensate the scrollbar so
  // the page doesn't shift, and pin the position in case overflow:hidden resets it.
  scroller.style.overflow = 'hidden';
  if (scrollbar > 0) scroller.style.paddingRight = `${scrollbar}px`;
  scroller.scrollTop = top;
  scroller.scrollLeft = left;

  // Everything outside the overlay's own element goes inert, so focus stays in it.
  const inerted = keep
    ? Array.from(document.body.children).filter((el) => el !== keep)
    : [];
  for (const el of inerted) el.setAttribute('inert', '');

  restore = () => {
    scroller.style.overflow = prevOverflow;
    scroller.style.paddingRight = prevPadding;
    scroller.scrollTop = top;
    scroller.scrollLeft = left;
    for (const el of inerted) el.removeAttribute('inert');
  };
}

// Imperative form for the standalone modal. `keep` stays interactive; defaults to
// the palette host.
export function engageOverlay(keep?: Element | null): () => void {
  count += 1;
  if (count === 1) {
    engage(keep ?? document.getElementById('sixpack-palette-host'));
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count -= 1;
    if (count === 0 && restore) {
      restore();
      restore = null;
    }
  };
}

export function useOverlay(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return engageOverlay();
  }, [active]);
}
