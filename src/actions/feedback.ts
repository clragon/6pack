import type { Action } from '../core/actions/types';
import type { PageContext } from '../core/context/types';
import { openInNewTab } from '../core/navigate';
import { readAccused } from '../site/ticket';
import { isModeratorPlus } from '../site/user';

// The user a feedback would be about, drawn from whichever page we're on.
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

// A user page and the feedback listing always imply a subject (an unfiltered
// listing just opens the form blank). A ticket only qualifies when it names an
// accused.
function hasSubject(page: PageContext): boolean {
  if (page.kind === 'user' || page.kind === 'userFeedbacks') return true;
  return page.kind === 'ticket' && readAccused() !== null;
}

// Creating feedback is moderator-only (UserFeedbacksController#new).
export const createFeedback: Action = {
  id: 'feedback.create',
  title: 'Create feedback',
  description: 'Create a user feedback record',
  keywords: ['feedback', 'create', 'record', 'add', 'user', 'positive', 'negative', 'neutral'],
  weight: 1,
  when: (page) => isModeratorPlus() && hasSubject(page),
  run: ({ page }) => {
    const id = subjectUserId(page);
    const url =
      id != null
        ? `/user_feedbacks/new?user_feedback[user_id]=${id}`
        : '/user_feedbacks/new';
    // New tab so the page you started from (ticket, profile, listing) stays put.
    openInNewTab(url);
  },
};
