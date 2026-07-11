import { render } from 'preact';

import { Comparison } from './Comparison';
import { gather } from './gather';

function findTable(): HTMLElement | null {
  const scoped = document.querySelector<HTMLElement>(
    '#c-post-replacements table',
  );
  if (scoped) return scoped;
  const row = document.querySelector('tr[id^="replacement-"]');
  return row?.closest('table') ?? null;
}

// The panel lives directly below the listing table on a post-scoped replacement
// search, filled once the current file resolves. A missing table (an empty or
// unscoped search) leaves the page untouched.
export function mountPanel(postId: number): () => void {
  const table = findTable();
  if (!table?.parentElement) return () => {};

  const host = document.createElement('div');
  host.className = 'sp-cmp-host';
  table.insertAdjacentElement('afterend', host);

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
