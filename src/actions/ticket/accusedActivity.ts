import type { Action } from '../../core/actions/types';
import { openInNewTab } from '../../core/navigate';
import { readAccused, readReportedContent } from '../../site/ticket';

interface Destination {
  id: string;
  title: string;
  surfaceTitle: string;
  keywords: string[];
  surface?: boolean;
  url: (userId: number) => string;
}

const DESTINATIONS: Destination[] = [
  {
    id: 'profile',
    title: 'Profile',
    surfaceTitle: 'View accused profile',
    keywords: ['profile', 'user', 'account', 'page'],
    url: (id) => `/users/${id}`,
  },
  {
    id: 'comments',
    title: 'Comments',
    surfaceTitle: 'View accused comments',
    keywords: ['comments', 'comment'],
    url: (id) => `/comments?group_by=comment&search[creator_id]=${id}`,
  },
  {
    id: 'post-versions',
    title: 'Post versions',
    surfaceTitle: 'View accused post versions',
    keywords: ['post', 'versions', 'changes', 'edits', 'tag', 'history'],
    url: (id) => `/post_versions?search[updater_id]=${id}`,
  },
  {
    id: 'forum-posts',
    title: 'Forum posts',
    surfaceTitle: 'View accused forum posts',
    keywords: ['forum', 'posts'],
    url: (id) => `/forum_posts?search[creator_id]=${id}`,
  },
  {
    id: 'blips',
    title: 'Blips',
    surfaceTitle: 'View accused blips',
    keywords: ['blips', 'blip'],
    url: (id) => `/blips?search[creator_id]=${id}`,
  },
  {
    id: 'feedback',
    title: 'Feedback',
    surfaceTitle: 'View accused feedback',
    keywords: ['feedback', 'record'],
    surface: true,
    url: (id) => `/user_feedbacks?search[user_id]=${id}`,
  },
];

const TYPE_TO_DEST: Record<string, string> = {
  comment: 'comments',
  forum: 'forum-posts',
  blip: 'blips',
  user: 'profile',
};

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
    const matched = TYPE_TO_DEST[readReportedContent()?.type ?? ''];
    return DESTINATIONS.map((dest) => ({
      id: `ticket.accused-activity.${dest.id}`,
      title: dest.title,
      surfaceTitle: dest.surfaceTitle,
      keywords: dest.keywords,
      surface: dest.surface || dest.id === matched,
      run: () => openInNewTab(dest.url(accused.id)),
    }));
  },
};
