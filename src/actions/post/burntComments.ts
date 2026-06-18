import type { Action } from '../../core/actions/types';
import {
  burntCommentsShown,
  hasBurntComments,
  toggleBurntComments,
} from '../../site/burntComments';

export const burntComments: Action = {
  id: 'post.burnt-comments',
  title: 'Hide burnt comments',
  description: 'Collapse burnt comments out of the thread',
  keywords: ['burnt', 'hidden', 'deleted', 'comments', 'hide', 'show', 'reveal'],
  weight: 1,
  when: (page) => page.kind === 'post' && hasBurntComments(),
  checked: () => !burntCommentsShown(),
  run: () => {
    toggleBurntComments();
  },
};
