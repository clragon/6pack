import uFuzzy from '@leeoniya/ufuzzy';

import type { Action } from '../actions/types';

// Single-error-per-term tolerance, including transpositions (letter swaps), so
// "cpoy psot" still resolves to "Copy post". Out-of-order terms are allowed.
const uf = new uFuzzy({
  intraMode: 1,
  intraIns: 1,
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
});

// Returns actions ranked by match quality. An empty query returns every action
// (the caller orders those by recency). `extraTerms` folds a group's child
// terms into its haystack so the group surfaces when a child matches the query.
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
