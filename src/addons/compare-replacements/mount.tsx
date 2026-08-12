import { render } from 'preact';

import { Comparison } from './Comparison';
import { gather } from './gather';

// A post-scoped search renders the timeline variant of the listing, every other
// one the plain list.
function findList(): HTMLElement | null {
  const scoped = document.querySelector<HTMLElement>(
    '#c-post-replacements .replacement-timeline, #c-post-replacements .replacement-list',
  );
  if (scoped) return scoped;
  const card = document.querySelector('.replacement-card');
  return card?.parentElement ?? null;
}

function Unavailable() {
  return (
    <div class="sp-cmp">
      <div class="sp-cmp-head">
        <span class="sp-cmp-title">Compare replacement</span>
      </div>
      <div class="sp-cmp-unavailable">no comparison available</div>
    </div>
  );
}

// An empty or unscoped search renders no listing, so the panel has nowhere to
// attach and the page goes untouched.
export function mountPanel(postId: number): () => void {
  const list = findList();
  if (!list?.parentElement) return () => {};

  const host = document.createElement('div');
  host.className = 'sp-cmp-host';
  list.insertAdjacentElement('afterend', host);

  let disposed = false;
  gather(postId, document).then(
    (result) => {
      if (disposed) return;
      if (!result) {
        host.remove();
        return;
      }
      render(
        result.kind === 'ready' ? (
          <Comparison data={result.data} />
        ) : (
          <Unavailable />
        ),
        host,
      );
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
