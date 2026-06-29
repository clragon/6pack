import { Level, type CurrentUser } from '../../site/user';

export interface NavDestination {
  slug: string;
  title: string;
  keywords?: string[];
  url: (user: CurrentUser | null) => string | null;
}

export const navDefaults: NavDestination[] = [
  {
    slug: 'home',
    title: 'Home',
    keywords: ['home', 'front', 'index'],
    url: () => '/',
  },
  {
    slug: 'posts',
    title: 'Posts',
    keywords: ['posts', 'browse', 'gallery'],
    url: () => '/posts',
  },
  {
    slug: 'popular',
    title: 'Popular',
    keywords: ['popular', 'hot', 'trending', 'explore'],
    url: () => '/popular',
  },
  {
    slug: 'comments',
    title: 'Comments',
    keywords: ['comments'],
    url: () => '/comments',
  },
  {
    slug: 'forum',
    title: 'Forum',
    keywords: ['forum', 'topics', 'threads'],
    url: () => '/forum_topics',
  },
  {
    slug: 'wiki',
    title: 'Wiki',
    keywords: ['wiki', 'pages', 'docs'],
    url: () => '/wiki_pages',
  },
  {
    slug: 'pools',
    title: 'Pools',
    keywords: ['pools'],
    url: () => '/pools',
  },
  {
    slug: 'sets',
    title: 'Sets',
    keywords: ['sets', 'post sets'],
    url: () => '/post_sets',
  },
  {
    slug: 'tags',
    title: 'Tags',
    keywords: ['tags'],
    url: () => '/tags',
  },
  {
    slug: 'artists',
    title: 'Artists',
    keywords: ['artists'],
    url: () => '/artists',
  },
  {
    slug: 'my-uploads',
    title: 'My uploads',
    keywords: ['uploads', 'mine', 'my'],
    url: (user) =>
      user ? `/posts?tags=${encodeURIComponent(`user:${user.name}`)}` : null,
  },
  {
    slug: 'my-favorites',
    title: 'My favorites',
    keywords: ['favorites', 'faves', 'mine', 'my'],
    url: (user) => (user ? '/favorites' : null),
  },
  {
    slug: 'account',
    title: 'My account',
    keywords: ['account', 'profile', 'me', 'dashboard'],
    url: (user) => (user ? '/users/home' : null),
  },
  {
    slug: 'pending-posts',
    title: 'Pending posts',
    keywords: ['pending', 'posts', 'queue', 'approvals', 'approve', 'moderate'],
    url: (user) =>
      user && user.level >= Level.Staff
        ? `/posts?tags=${encodeURIComponent('status:pending')}`
        : null,
  },
  {
    slug: 'tickets',
    title: 'Tickets',
    keywords: ['tickets', 'reports'],
    url: (user) => (user && user.level >= Level.Staff ? '/tickets' : null),
  },
  {
    slug: 'pending-tickets',
    title: 'Pending tickets',
    keywords: ['pending', 'tickets', 'reports', 'queue', 'unclaimed'],
    url: (user) =>
      user && user.level >= Level.Staff
        ? '/tickets?search[status]=pending_unclaimed'
        : null,
  },
  {
    slug: 'appeals',
    title: 'Appeals',
    keywords: ['appeals', 'appeal', 'undelete'],
    url: (user) => (user && user.level >= Level.Staff ? '/appeals' : null),
  },
  {
    slug: 'bans',
    title: 'Bans',
    keywords: ['bans', 'banned'],
    url: (user) => (user && user.level >= Level.Moderator ? '/bans' : null),
  },
  {
    slug: 'mod-actions',
    title: 'Mod actions',
    keywords: ['mod', 'actions', 'log', 'modlog', 'audit', 'staff'],
    url: (user) => (user && user.level >= Level.Staff ? '/mod_actions' : null),
  },
  {
    slug: 'staff-wiki',
    title: 'Staff wiki',
    keywords: ['staff', 'wiki', 'internal', 'docs'],
    url: (user) => (user && user.level >= Level.Staff ? '/staff/wikis' : null),
  },
  {
    slug: 'staff-files',
    title: 'Staff files',
    keywords: ['staff', 'files', 'internal', 'downloads'],
    url: (user) => (user && user.level >= Level.Staff ? '/staff/files' : null),
  },
];
