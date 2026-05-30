import type { Action } from '../../core/actions/types';
import { openInNewTab } from '../../core/navigate';
import { readAccused } from '../../site/ticket';

export const viewAccusedFeedback: Action = {
  id: 'ticket.accused-feedback',
  title: 'View accused feedback',
  description: "Open the accused user's feedback record",
  keywords: ['accused', 'feedback', 'record', 'user', 'history', 'ticket'],
  weight: 1,
  when: (page) => page.kind === 'ticket' && readAccused() !== null,
  run: () => {
    const accused = readAccused();
    if (accused) openInNewTab(`/user_feedbacks?search[user_id]=${accused.id}`);
  },
};
