import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import type { SixpackAddon } from '../../core/addons/types';
import OUROBORU_CSS from './styles.css?inline';

interface Blacklist {
  addPosts: (posts: unknown) => void;
  updateThumbnailStyles?: () => void;
  updatePostVisibility: () => void;
}

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
  if (firstHere) firstHere.dataset.spObHref = location.href;

  const style = document.createElement('style');
  style.textContent = OUROBORU_CSS;
  document.head.appendChild(style);

  const tail = document.createElement('div');
  tail.className = 'sp-ob-tail';
  const status = document.createElement('span');
  status.className = 'sp-ob-status';
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
    const from = nextHref;
    setState('loading', 'Loading more…');
    try {
      const res = await fetch(nextHref, {
        credentials: 'same-origin',
        // FavoritesController declares respond_to json before html, so a
        // wildcard Accept gets json there.
        headers: { Accept: 'text/html' },
      });
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
        if (added.length === 0) post.dataset.spObHref = from;
        container.appendChild(post);
        added.push(post);
      }

      nextHref = nextHrefIn(doc);

      const win = pageGlobals();
      const e6 = win.E621 || win.Danbooru;
      const $ = win.jQuery;
      if (added.length && $ && e6?.Blacklist) {
        const $new = $(added);
        e6.Blacklist.addPosts($new);
        e6.Blacklist.updateThumbnailStyles?.();
        e6.Blacklist.updatePostVisibility();
      }

      if (!nextHref) setState('end', "That's everything.");
      else setState('ready', '');
    } catch (err) {
      console.error('[ouroboru] failed to load next page', err);
      auto = false;
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

  let queued = false;
  const syncUrl = () => {
    queued = false;
    let current: string | undefined;
    for (const marker of container.querySelectorAll<HTMLElement>(
      'article.thumbnail[data-sp-ob-href]',
    )) {
      if (marker.getBoundingClientRect().top > 80) break;
      current = marker.dataset.spObHref;
    }
    if (!current || current === location.href) return;
    history.replaceState(history.state, '', current);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(syncUrl);
  };
  document.addEventListener('scroll', onScroll, {
    capture: true,
    passive: true,
  });

  return () => {
    observer.disconnect();
    document.removeEventListener('scroll', onScroll, { capture: true });
    button.removeEventListener('click', onClick);
    tail.remove();
    style.remove();
  };
}

export const ouroboruAddon: SixpackAddon = {
  id: 'ouroboru',
  name: 'Ouroboru',
  description: 'Infinite scrolling for post listings.',
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
