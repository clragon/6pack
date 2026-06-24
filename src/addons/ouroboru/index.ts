import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon } from '../../core/addons/types';

// Endless scroll for post listings: append the next page as the bottom nears.

interface Blacklist {
  add_posts: (posts: unknown) => void;
  update_styles?: () => void;
  update_visibility: () => void;
}

// e621's blacklist lives on the page window, not 6pack's sandbox.
function pageGlobals(): {
  E621?: { Blacklist?: Blacklist };
  Danbooru?: { Blacklist?: Blacklist };
  jQuery?: (els: unknown) => unknown;
} {
  return unsafeWindow as never;
}

function nextHrefIn(root: ParentNode): string | null {
  const el = root.querySelector('#paginator-next');
  const href = el && el.tagName === 'A' ? el.getAttribute('href') : null;
  return href ? new URL(href, location.href).href : null;
}

function pageOf(href: string): string {
  return new URL(href, location.href).searchParams.get('page') || '1';
}

function mount(): () => void {
  const container = document.querySelector('section.posts-container');
  if (!container) return () => {};

  let nextHref = nextHrefIn(document);
  if (!nextHref) return () => {};

  const seen = new Set(
    [
      ...container.querySelectorAll<HTMLElement>('article.thumbnail[data-id]'),
    ].map((a) => a.dataset.id),
  );

  const firstHere = container.querySelector<HTMLElement>('article.thumbnail');
  if (firstHere) firstHere.dataset.obPage = pageOf(location.href);

  const style = document.createElement('style');
  style.textContent = `
    .ob-tail { display:flex; align-items:center; justify-content:center; gap:1em; padding:2em 0; }
    .ob-tail button { font:inherit; cursor:pointer; }
    .ob-tail:not([state="error"]):not([state="ready"]) button { display:none; }
    .ob-status { opacity:0.7; }
  `;
  document.head.appendChild(style);

  const tail = document.createElement('div');
  tail.className = 'ob-tail';
  const status = document.createElement('span');
  status.className = 'ob-status';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Load more';
  tail.append(status, button);
  container.insertAdjacentElement('afterend', tail);

  const setState = (state: string, text?: string) => {
    tail.setAttribute('state', state);
    status.textContent = text ?? '';
  };

  let loading = false;
  let auto = true;

  const loadNext = async () => {
    if (loading || !nextHref) return;
    loading = true;
    const page = pageOf(nextHref);
    setState('loading', 'Loading more…');
    try {
      const res = await fetch(nextHref, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(
        await res.text(),
        'text/html',
      );
      const incoming = doc.querySelector('section.posts-container');
      const posts = incoming
        ? [...incoming.querySelectorAll<HTMLElement>('article.thumbnail')]
        : [];

      const added: HTMLElement[] = [];
      for (const post of posts) {
        const id = post.dataset.id;
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);
        if (added.length === 0) post.dataset.obPage = page;
        container.appendChild(post);
        added.push(post);
      }

      nextHref = nextHrefIn(doc);

      // run the appended thumbnails through e621's own blacklist
      const win = pageGlobals();
      const e6 = win.E621 || win.Danbooru;
      const $ = win.jQuery;
      if (added.length && $ && e6?.Blacklist) {
        const $new = $(added);
        e6.Blacklist.add_posts($new);
        e6.Blacklist.update_styles?.();
        e6.Blacklist.update_visibility();
      }

      if (!nextHref) setState('end', "That's everything.");
      else setState('ready', '');
    } catch (err) {
      console.error('[ouroboru] failed to load next page', err);
      auto = false; // stop after an error; the button is the manual retry
      setState('error', "Couldn't fetch the next page. Click to retry.");
    } finally {
      loading = false;
    }
  };

  const onClick = () => {
    auto = true;
    void loadNext();
  };
  button.addEventListener('click', onClick);

  const observer = new IntersectionObserver(
    (entries) => {
      if (auto && entries.some((e) => e.isIntersecting)) void loadNext();
    },
    { rootMargin: '0px 0px 800px 0px' },
  );
  observer.observe(tail);

  // reflect the topmost visible page in the url so a reload resumes there
  let queued = false;
  const syncUrl = () => {
    queued = false;
    let current: string | undefined;
    for (const marker of container.querySelectorAll<HTMLElement>(
      'article.thumbnail[data-ob-page]',
    )) {
      if (marker.getBoundingClientRect().top > 80) break;
      current = marker.dataset.obPage;
    }
    if (!current) return;
    const url = new URL(location.href);
    if (current === '1') url.searchParams.delete('page');
    else url.searchParams.set('page', current);
    if (url.href !== location.href)
      history.replaceState(history.state, '', url.href);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(syncUrl);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
    button.removeEventListener('click', onClick);
    tail.remove();
    style.remove();
  };
}

// setup self-detects the posts container, so it needs no `when`.
export const ouroboruAddon: SixpackAddon = {
  id: 'ouroboru',
  name: 'Ouroboru',
  setup: () => mount(),
};
