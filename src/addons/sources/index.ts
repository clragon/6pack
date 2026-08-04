import type { SixpackAddon } from '../../core/addons/types';
import { getSourceLabel } from '../../core/sources/url';

// Shortens source links in the post sidebar to their salient token by rewriting
// the visible label. The selector takes only http anchors (skipping the janitor
// "»" and the add-source icon link) and excludes the verifier's replacement
// anchor, which wraps an icon rather than text.

// Marks an already-shortened node and stashes its original text for restore.
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

// The verifier stamps the artists it resolved onto the anchor as JSON, a bare
// handle for some platforms and a list for others.
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

// The verifier prepends its match icons into the same node, so the label swap
// has to leave everything but the text alone.
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

  // The verifier injects its source lists asynchronously, and stamps the
  // authors on anchors we already shortened; relabel on both.
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
  description:
    "Each source in a post's sidebar is labeled by its identifying part: the artist's handle, the id, or the filename. The origin of a post, and any duplication among its sources, is therefore apparent without reading the addresses in full. The complete address remains available on hover.",
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
