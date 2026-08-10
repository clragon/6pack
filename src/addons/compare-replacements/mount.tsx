import { render } from 'preact';

import { Comparison } from './Comparison';
import { gather } from './gather';

// e621's post_replacements index renders replacement-timeline for a single post
// search and replacement-list otherwise.
function findList(): HTMLElement | null {
  const scoped = document.querySelector<HTMLElement>(
    '#c-post-replacements .replacement-timeline, #c-post-replacements .replacement-list',
  );
  if (scoped) return scoped;
  const card = document.querySelector('.replacement-card');
  return card?.parentElement ?? null;
}

export function mountPanel(postId: number): () => void {
  const list = findList();
  if (!list?.parentElement) return () => {};

  const host = document.createElement('div');
  host.className = 'sp-cmp-host';
  list.insertAdjacentElement('afterend', host);

  let disposed = false;
  gather(postId, document).then(
    (data) => {
      if (disposed) return;
      if (!data) {
        host.remove();
        return;
      }
      render(<Comparison data={data} />, host);
    },
    () => {
      if (!disposed) host.remove();
    },
  );

  return () => {
    disposed = true;
    render(null, host);
    host.remove();
  };
}
