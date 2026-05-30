import type { Action } from '../core/actions/types';
import type { ReportedType } from '../site/ticket';
import { openInNewTab } from '../core/navigate';

interface Listing {
  id: string;
  // Short title shown inside the submenu.
  title: string;
  // Noun for the surfaced "View <subject> <noun>" title.
  noun: string;
  keywords: string[];
  url: (userId: number) => string;
  // The reported content type (on a ticket) that promotes this to the top level.
  matchesType?: ReportedType;
}

// A user's activity, each a listing filtered to them. Shared between the accused
// of a ticket and any user's profile.
const LISTINGS: Listing[] = [
  {
    id: 'comments',
    title: 'Comments',
    noun: 'comments',
    keywords: ['comments', 'comment'],
    url: (id) => `/comments?group_by=comment&search[creator_id]=${id}`,
    matchesType: 'comment',
  },
  {
    id: 'post-versions',
    title: 'Post versions',
    noun: 'post versions',
    keywords: ['post', 'versions', 'changes', 'edits', 'tag', 'history'],
    url: (id) => `/post_versions?search[updater_id]=${id}`,
  },
  {
    id: 'forum-posts',
    title: 'Forum posts',
    noun: 'forum posts',
    keywords: ['forum', 'posts'],
    url: (id) => `/forum_posts?search[creator_id]=${id}`,
    matchesType: 'forum',
  },
  {
    id: 'blips',
    title: 'Blips',
    noun: 'blips',
    keywords: ['blips', 'blip'],
    url: (id) => `/blips?search[creator_id]=${id}`,
    matchesType: 'blip',
  },
  {
    id: 'feedback',
    title: 'Feedback',
    noun: 'feedback',
    keywords: ['feedback', 'record'],
    url: (id) => `/user_feedbacks?search[user_id]=${id}`,
  },
];

export interface ActivityOptions {
  // Action id namespace, e.g. 'ticket.accused-activity'.
  idBase: string;
  userId: number;
  // Inserted into surfaced titles: 'accused' gives "View accused comments". Omit
  // on a profile, where the page already names the user.
  subject?: string;
  // On a ticket, the reported content type, so the matching listing surfaces.
  surfacedType?: ReportedType;
  // Surface the feedback listing at the top level regardless of type.
  surfaceFeedback?: boolean;
}

// New tab throughout so the page you started from stays put.
export function activityListings(opts: ActivityOptions): Action[] {
  const prefix = opts.subject ? `${opts.subject} ` : '';
  return LISTINGS.map((listing) => ({
    id: `${opts.idBase}.${listing.id}`,
    title: listing.title,
    surfaceTitle: `View ${prefix}${listing.noun}`,
    keywords: listing.keywords,
    surface:
      (listing.id === 'feedback' && !!opts.surfaceFeedback) ||
      (listing.matchesType !== undefined &&
        listing.matchesType === opts.surfacedType),
    run: () => openInNewTab(listing.url(opts.userId)),
  }));
}

export const userActivity: Action = {
  id: 'user.activity',
  title: 'Activity',
  description: "Browse this user's records",
  keywords: [
    'activity',
    'history',
    'comments',
    'forum',
    'blips',
    'feedback',
    'versions',
    'posts',
  ],
  weight: 1,
  when: (page) => page.kind === 'user',
  submenu: ({ page }) =>
    page.kind === 'user'
      ? activityListings({ idBase: 'user.activity', userId: page.id })
      : [],
};
