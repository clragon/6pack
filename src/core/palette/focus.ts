// Focus without moving the page. preventScroll isn't reliable for shadow-DOM
// inputs in Firefox, so we also capture and restore the scroll position.
export function focusNoScroll(el: HTMLElement | null): void {
  if (!el) return;
  const x = window.scrollX;
  const y = window.scrollY;
  el.focus({ preventScroll: true });
  if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
}

// The truly focused element, descending through shadow roots (our palette input
// lives in one, so document.activeElement alone reports the host).
export function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

export function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el as HTMLElement).isContentEditable
  );
}
