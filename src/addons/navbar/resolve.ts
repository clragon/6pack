import { expandTokens, type TokenSpec } from '../../core/template';
import { currentUser } from '../../site/user';
import { listEntries, type NavEntry } from './store';

const TOKENS: TokenSpec[] = [
  { token: 'username', resolve: () => currentUser()?.name ?? null },
  {
    token: 'userid',
    resolve: () => {
      const user = currentUser();
      return user ? String(user.id) : null;
    },
  },
];

export function expand(url: string): string {
  return expandTokens(url, TOKENS);
}

export function pinnedEntries(): NavEntry[] {
  return listEntries().filter((entry) => entry.pinned);
}

export function isActive(url: string): boolean {
  const path = expand(url).split(/[?#]/)[0];
  const here = location.pathname;
  return here === path || (path !== '/' && here.startsWith(path + '/'));
}

// e621's nav_link_to ids each tab nav- plus the title lowercased and kept to
// letters and spaces, and RE621's HeaderCustomizer looks up li#nav-forum.
export function domId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .replace(/ +/g, '-');
  return 'nav-' + slug;
}
