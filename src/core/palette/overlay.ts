import { useEffect } from 'preact/hooks';

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
  scroller.style.overflow = 'hidden';
  if (scrollbar > 0) scroller.style.paddingRight = `${scrollbar}px`;
  scroller.scrollTop = top;
  scroller.scrollLeft = left;

  const inerted = keep
    ? Array.from(document.body.children).filter((el) => el !== keep)
    : [];
  for (const el of inerted) el.setAttribute('inert', '');

  // e621's hotkeys guard reads document.activeElement, which names the shadow
  // host as a div, so a keydown escaping the shadow root would fire them.
  const shield = (event: Event) => event.stopPropagation();
  keep?.addEventListener('keydown', shield);

  restore = () => {
    scroller.style.overflow = prevOverflow;
    scroller.style.paddingRight = prevPadding;
    scroller.scrollTop = top;
    scroller.scrollLeft = left;
    for (const el of inerted) el.removeAttribute('inert');
    keep?.removeEventListener('keydown', shield);
  };
}

export function engageOverlay(keep?: Element | null): () => void {
  count += 1;
  if (count === 1) {
    engage(keep ?? document.getElementById('sp-palette-host'));
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
