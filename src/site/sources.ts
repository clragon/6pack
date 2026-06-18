import { settings } from '../core/settings';
import { getSourceDisplayLabel } from '../core/sources/url';

const STASH = 'sixpackSource';

const ANCHOR_SELECTOR =
  '.source-link a[href^="http"]:not(.jsv-replacement-anchor)';

function sourceAnchors(root: ParentNode): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>(ANCHOR_SELECTOR));
}

function labelNode(anchor: HTMLAnchorElement): HTMLElement {
  return anchor.querySelector('span') ?? anchor;
}

function shorten(anchor: HTMLAnchorElement): void {
  const el = labelNode(anchor);
  if (el.dataset[STASH] !== undefined) return;
  const href = anchor.getAttribute('href');
  if (!href) return;
  const label = getSourceDisplayLabel(href);
  const original = el.textContent ?? '';
  if (label === original) return;
  el.dataset[STASH] = original;
  el.textContent = label;
  anchor.title = original;
}

function restore(anchor: HTMLAnchorElement): void {
  const el = labelNode(anchor);
  const original = el.dataset[STASH];
  if (original === undefined) return;
  el.textContent = original;
  delete el.dataset[STASH];
  anchor.removeAttribute('title');
}

function shortenWithin(node: HTMLElement): void {
  if (node.matches(ANCHOR_SELECTOR)) shorten(node as HTMLAnchorElement);
  for (const anchor of sourceAnchors(node)) shorten(anchor);
}

function applyAll(on: boolean): void {
  for (const anchor of sourceAnchors(document)) {
    if (on) shorten(anchor);
    else restore(anchor);
  }
}

export function mountSourceShortening(): void {
  applyAll(settings.get('shortenSources'));

  const observer = new MutationObserver((mutations) => {
    if (!settings.get('shortenSources')) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) shortenWithin(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  settings.subscribe(() => applyAll(settings.get('shortenSources')));
}
