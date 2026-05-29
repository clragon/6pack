// Firefox ignores preventScroll for inputs inside a shadow root, so the scroll
// position is restored by hand.
export function focusNoScroll(el: HTMLElement | null): void {
  if (!el) return;
  const x = window.scrollX;
  const y = window.scrollY;
  el.focus({ preventScroll: true });
  if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
}

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
