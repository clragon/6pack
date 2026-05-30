import type { Action } from '../core/actions/types';
import { navigateTo } from '../core/navigate';
import { readBanForm } from '../site/ban';
import { readFeedbackForm } from '../site/feedback';
import { isModeratorPlus } from '../site/user';

// Feedback and ban share the same essential fields (user + reason), so a draft of
// one converts to the other by carrying the text across via the destination
// form's URL prefill. Same tab: the current draft is being switched, not kept.
// Caveat: very long text rides in the URL; fine for typical reasons.

export const convertToBan: Action = {
  id: 'feedback.convert-to-ban',
  title: 'Convert to ban',
  description: 'Switch this draft to a ban instead',
  keywords: ['convert', 'ban', 'feedback', 'switch', 'escalate'],
  weight: 1,
  when: () => isModeratorPlus() && readFeedbackForm() !== null,
  run: () => {
    const form = readFeedbackForm();
    if (!form) return;
    const params = new URLSearchParams();
    if (form.userName) params.set('ban[user_name]', form.userName);
    if (form.body) params.set('ban[reason]', form.body);
    navigateTo(`/bans/new?${params}`);
  },
};

export const convertToFeedback: Action = {
  id: 'ban.convert-to-feedback',
  title: 'Convert to feedback',
  description: 'Switch this draft to a feedback instead',
  keywords: ['convert', 'feedback', 'ban', 'switch', 'downgrade'],
  weight: 1,
  when: () => isModeratorPlus() && readBanForm() !== null,
  run: () => {
    const form = readBanForm();
    if (!form) return;
    const params = new URLSearchParams();
    if (form.userName) params.set('user_feedback[user_name]', form.userName);
    if (form.reason) params.set('user_feedback[body]', form.reason);
    navigateTo(`/user_feedbacks/new?${params}`);
  },
};
