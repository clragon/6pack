import type { Action } from '../core/actions/types';
import type { PageContext } from '../core/context/types';
import { openInNewTab } from '../core/navigate';
import { readBanForm, readBanSubjectUser } from '../site/ban';
import { readFeedbackForm } from '../site/feedback';

// The /users/<ref> segment to open. e621 resolves it by id or by name
// (UsersController#show).
function profileRef(page: PageContext): string | null {
  if (page.kind === 'userFeedbacks' && page.userId != null)
    return String(page.userId);
  const banSubject = readBanSubjectUser();
  if (banSubject) return String(banSubject.id);
  const feedbackForm = readFeedbackForm();
  if (feedbackForm?.userName) return feedbackForm.userName;
  const banForm = readBanForm();
  if (banForm?.userName) return banForm.userName;
  return null;
}

export const viewUser: Action = {
  id: 'nav.view-user',
  title: 'View user',
  description: "Open the user's profile",
  keywords: ['user', 'profile', 'view', 'open', 'account'],
  weight: 1,
  when: (page) => profileRef(page) !== null,
  run: ({ page }) => {
    const ref = profileRef(page);
    if (ref) openInNewTab(`/users/${encodeURIComponent(ref)}`);
  },
};
