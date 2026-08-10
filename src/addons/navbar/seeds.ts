import { Level, currentUser } from '../../site/user';
import type { NavEntry } from './store';

// `level` is the e621 user level required to receive the entry.
interface Seed extends NavEntry {
  level?: number;
}

// The starter set: e621's own primary bar in its order, then the jumps worth
// reaching by name.
const SEEDS: Seed[] = [
  { id: 'artists', title: 'Artists', url: '/artists', icon: 'brush' },
  { id: 'posts', title: 'Posts', url: '/posts', icon: 'images' },
  { id: 'pools', title: 'Pools', url: '/pools/gallery', icon: 'library' },
  { id: 'sets', title: 'Sets', url: '/post_sets', icon: 'group' },
  { id: 'tags', title: 'Tags', url: '/tags', icon: 'tags' },
  { id: 'blips', title: 'Blips', url: '/blips', icon: 'megaphone' },
  { id: 'comments', title: 'Comments', url: '/comments', icon: 'message' },
  { id: 'forum', title: 'Forum', url: '/forum_topics', icon: 'lectern' },

  { id: 'home', title: 'Home', url: '/', icon: 'home' },
  { id: 'popular', title: 'Popular', url: '/popular', icon: 'trending' },
  {
    id: 'wiki',
    title: 'Wiki',
    url: '/wiki_pages?title=help%3Ahome',
    icon: 'book',
  },
  {
    id: 'my-uploads',
    title: 'My uploads',
    url: '/posts?tags=user%3A%username%',
    icon: 'upload',
    level: Level.Member,
  },
  {
    id: 'my-favorites',
    title: 'My favorites',
    url: '/favorites',
    icon: 'heart',
    level: Level.Member,
  },
  {
    id: 'account',
    title: 'My account',
    url: '/users/home',
    icon: 'user',
    level: Level.Member,
  },
  {
    id: 'pending-posts',
    title: 'Pending posts',
    url: '/posts?tags=status%3Apending',
    icon: 'clock',
    level: Level.Staff,
  },
  {
    id: 'tickets',
    title: 'Tickets',
    url: '/tickets',
    icon: 'ticket',
    level: Level.Staff,
  },
  {
    id: 'pending-tickets',
    title: 'Pending tickets',
    url: '/tickets?search[status]=pending_unclaimed',
    icon: 'inbox',
    level: Level.Staff,
  },
  {
    id: 'appeals',
    title: 'Appeals',
    url: '/appeals',
    icon: 'scale',
    level: Level.Staff,
  },
  {
    id: 'pending-appeals',
    title: 'Pending appeals',
    url: '/appeals?search[status]=pending_unclaimed',
    icon: 'clock',
    level: Level.Staff,
  },
  {
    id: 'bans',
    title: 'Bans',
    url: '/bans',
    icon: 'gavel',
    level: Level.Moderator,
  },
  {
    id: 'mod-actions',
    title: 'Mod actions',
    url: '/mod_actions',
    icon: 'shield',
    level: Level.Staff,
  },
  {
    id: 'staff-wiki',
    title: 'Staff wiki',
    url: '/staff/wikis',
    icon: 'scroll',
    level: Level.Staff,
  },
  {
    id: 'staff-files',
    title: 'Staff files',
    url: '/staff/files',
    icon: 'folder',
    level: Level.Staff,
  },
];

// The ids that mirror e621's own bar, and so start pinned.
const PINNED = [
  'artists',
  'posts',
  'pools',
  'sets',
  'tags',
  'blips',
  'comments',
  'forum',
];

export function seedEntries(): NavEntry[] {
  const level = currentUser()?.level ?? 0;
  return SEEDS.filter((seed) => level >= (seed.level ?? 0)).map(
    (seed): NavEntry => ({
      id: seed.id,
      title: seed.title,
      url: seed.url,
      icon: seed.icon,
      pinned: PINNED.includes(seed.id),
    }),
  );
}
