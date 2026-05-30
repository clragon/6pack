import type { Action } from '../../core/actions/types';
import { openInNewTab } from '../../core/navigate';
import { readAccused, readReportedContent } from '../../site/ticket';
import { activityListings } from '../activity';

export const accusedActivity: Action = {
  id: 'ticket.accused-activity',
  title: 'Accused activity',
  description: "Browse the accused user's records",
  keywords: [
    'accused',
    'reported',
    'user',
    'activity',
    'history',
    'comments',
    'forum',
    'versions',
    'blips',
    'feedback',
    'profile',
  ],
  weight: 1,
  when: (page) => page.kind === 'ticket' && readAccused() !== null,
  submenu: () => {
    const accused = readAccused();
    if (!accused) return [];
    const type = readReportedContent()?.type;
    // Profile leads the menu, and a user-type ticket promotes it to the top level.
    const profile: Action = {
      id: 'ticket.accused-activity.profile',
      title: 'Profile',
      surfaceTitle: 'View accused profile',
      keywords: ['profile', 'user', 'account', 'page'],
      surface: type === 'user',
      run: () => openInNewTab(`/users/${accused.id}`),
    };
    return [
      profile,
      ...activityListings({
        idBase: 'ticket.accused-activity',
        userId: accused.id,
        subject: 'accused',
        surfacedType: type,
        surfaceFeedback: true,
      }),
    ];
  },
};
