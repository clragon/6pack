import type { Action } from '../../core/actions/types';
import { openInNewTab } from '../../core/navigate';
import { readAccused } from '../../site/ticket';

export const viewAccusedFeedback: Action = {
  id: 'ticket.accused-feedback',
  title: 'View accused feedback',
  description: "Open the accused user's feedback record",
  keywords: ['accused', 'feedback', 'record', 'user', 'history', 'ticket'],
  weight: 1,
  // The Accused row is absent on post/pool/wiki reports, so this hides there.
  when: (page) => page.kind === 'ticket' && readAccused() !== null,
  run: () => {
    const accused = readAccused();
    // New tab so the ticket stays open behind the feedback record.
    if (accused) openInNewTab(`/user_feedbacks?search[user_id]=${accused.id}`);
  },
};
