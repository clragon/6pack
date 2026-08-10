import { expandTokens, type TokenSpec } from '../../core/template';
import { currentUser } from '../../site/user';
import { navStore, type NavEntry } from './store';

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

// A saved url stores these tokens verbatim, so the spelling is fixed. Changing
// it leaves every stored entry holding a token nothing expands.
export function expand(url: string): string {
  return expandTokens(url, TOKENS);
}

export function pinnedEntries(): NavEntry[] {
  return navStore.pinned();
}

// e621 marks the tab for the section you are in. Matching on the path alone
// keeps a search-carrying entry (My uploads) lit while browsing posts.
export function isActive(url: string): boolean {
  const path = expand(url).split(/[?#]/)[0];
  const here = location.pathname;
  return here === path || (path !== '/' && here.startsWith(path + '/'));
}

// e621 ids its tabs `nav-<title>`, and other scripts reach for those (RE621
// looks up `#nav-forum`), so ours are built the same way.
export function domId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .replace(/ +/g, '-');
  return 'nav-' + slug;
}
