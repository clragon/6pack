import uFuzzy from '@leeoniya/ufuzzy';

import type { Action } from '../actions/types';

// uFuzzy intraMode 1 allows one edit per term, so "cpoy psot" still finds
// "Copy post", and the third argument of uf.search allows out of order terms.
const uf = new uFuzzy({
  intraMode: 1,
  intraIns: 1,
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
});

export function namedExactly(action: Action, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return (
    action.title.toLowerCase() === needle ||
    (action.keywords ?? []).some((word) => word.toLowerCase() === needle)
  );
}

export function searchActions(
  query: string,
  actions: Action[],
  extraTerms?: (action: Action) => string[],
): Action[] {
  const needle = query.trim();
  if (!needle) return actions.slice();

  const haystack = actions.map((action) =>
    [
      action.title,
      ...(action.keywords ?? []),
      ...(extraTerms?.(action) ?? []),
    ].join(' '),
  );
  const [idxs, info, order] = uf.search(haystack, needle, 1);
  if (!idxs || idxs.length === 0) return [];
  if (info && order) return order.map((o) => actions[info.idx[o]]);
  return idxs.map((i) => actions[i]);
}
