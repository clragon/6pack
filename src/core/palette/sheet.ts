// Put a stylesheet in document.head once, for the parts of an add-on that live in
// the page's light DOM: an injected strip, a DText editor slotted into a shadow
// dialog. Anything rendered inside a shadow root carries its own sheet instead.
export function ensureSheet(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
