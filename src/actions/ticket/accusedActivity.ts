import type { Action } from '../../core/actions/types';
import { openInNewTab } from '../../core/navigate';
import { readAccused } from '../../site/ticket';

interface Destination {
  id: string;
  title: string;
  keywords: string[];
  url: (userId: number) => string;
}

const DESTINATIONS: Destination[] = [
  {
    id: 'comments',
    title: 'Comments',
    keywords: ['comments', 'comment'],
    url: (id) => `/comments?group_by=comment&search[creator_id]=${id}`,
  },
  {
    id: 'post-versions',
    title: 'Post versions',
    keywords: ['post', 'versions', 'changes', 'edits', 'tag', 'history'],
    url: (id) => `/post_versions?search[updater_id]=${id}`,
  },
  {
    id: 'forum-posts',
    title: 'Forum posts',
    keywords: ['forum', 'posts'],
    url: (id) => `/forum_posts?search[creator_id]=${id}`,
  },
  {
    id: 'feedback',
    title: 'Feedback',
    keywords: ['feedback', 'record'],
    url: (id) => `/user_feedbacks?search[user_id]=${id}`,
  },
];

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
    'feedback',
  ],
  weight: 1,
  when: (page) => page.kind === 'ticket' && readAccused() !== null,
  submenu: () => {
    const accused = readAccused();
    if (!accused) return [];
    return DESTINATIONS.map((dest) => ({
      id: `ticket.accused-activity.${dest.id}`,
      title: dest.title,
      keywords: dest.keywords,
      run: () => openInNewTab(dest.url(accused.id)),
    }));
  },
};
