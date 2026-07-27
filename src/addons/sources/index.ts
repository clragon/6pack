import type { SixpackAddon } from '../../core/addons/types';
import { getSourceLabel } from '../../core/sources/url';

const STASH = 'sixpackSource';

const ANCHOR_SELECTOR =
  '.source-link a[href^="http"]:not(.jsv-replacement-anchor)';

const AUTHORS_ATTRIBUTE = 'data-authors';

function sourceAnchors(root: ParentNode): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>(ANCHOR_SELECTOR));
}

function labelNode(anchor: HTMLAnchorElement): HTMLElement {
  return anchor.querySelector('span') ?? anchor;
}

function readAuthors(anchor: HTMLAnchorElement): string[] | undefined {
  const raw = anchor.getAttribute(AUTHORS_ATTRIBUTE);
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed ? [parsed] : undefined;
    if (Array.isArray(parsed))
      return parsed.filter((a) => typeof a === 'string');
  } catch {
    return undefined;
  }
  return undefined;
}

function setLabel(el: HTMLElement, text: string): void {
  const node = Array.from(el.childNodes).find(
    (n): n is Text => n.nodeType === Node.TEXT_NODE,
  );
  if (node) node.data = text;
  else el.appendChild(document.createTextNode(text));
}

function shorten(anchor: HTMLAnchorElement): void {
  const el = labelNode(anchor);
  const href = anchor.getAttribute('href');
  if (!href) return;
  const original = el.dataset[STASH] ?? el.textContent ?? '';
  const label = getSourceLabel(href, readAuthors(anchor));
  if (label === el.textContent) return;
  el.dataset[STASH] = original;
  setLabel(el, label);
  anchor.title = original;
}

function restore(anchor: HTMLAnchorElement): void {
  const el = labelNode(anchor);
  const original = el.dataset[STASH];
  if (original === undefined) return;
  setLabel(el, original);
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

function mount(): () => void {
  applyAll(true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) shortenWithin(node);
      }
      const target = mutation.target;
      if (
        mutation.attributeName === AUTHORS_ATTRIBUTE &&
        target instanceof HTMLAnchorElement &&
        target.matches(ANCHOR_SELECTOR)
      ) {
        shorten(target);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributeFilter: [AUTHORS_ATTRIBUTE],
  });

  return () => {
    observer.disconnect();
    applyAll(false);
  };
}

export const sourcesAddon: SixpackAddon = {
  id: 'sources',
  name: 'Source shortener',
  description: 'Shortens pasted source links to their canonical form.',
  when: (page) => page.kind === 'post',
  setup: (ctx) => {
    let disposed = false;
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardown = mount();
    });
    return () => {
      disposed = true;
      teardown?.();
    };
  },
};
