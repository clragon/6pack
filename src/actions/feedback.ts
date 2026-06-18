import type { Action } from '../core/actions/types';
import type { PageContext } from '../core/context/types';
import { openInNewTab } from '../core/navigate';
import { readAccused } from '../site/ticket';
import { isModeratorPlus } from '../site/user';

function subjectUserId(page: PageContext): number | null {
  switch (page.kind) {
    case 'user':
      return page.id;
    case 'userFeedbacks':
      return page.userId;
    case 'ticket':
      return readAccused()?.id ?? null;
    default:
      return null;
  }
}

function hasSubject(page: PageContext): boolean {
  if (page.kind === 'user' || page.kind === 'userFeedbacks') return true;
  return page.kind === 'ticket' && readAccused() !== null;
}

export const createFeedback: Action = {
  id: 'feedback.create',
  title: 'Create feedback',
  description: 'Create a user feedback record',
  keywords: [
    'feedback',
    'create',
    'record',
    'add',
    'user',
    'positive',
    'negative',
    'neutral',
  ],
  weight: 1,
  // UserFeedbacksController is moderator_only except for index and show.
  when: (page) => isModeratorPlus() && hasSubject(page),
  run: ({ page }) => {
    const id = subjectUserId(page);
    const url =
      id != null
        ? `/user_feedbacks/new?user_feedback[user_id]=${id}`
        : '/user_feedbacks/new';
    openInNewTab(url);
  },
};
