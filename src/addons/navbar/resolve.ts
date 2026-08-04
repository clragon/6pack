import { currentUser } from '../../site/user';
import { listEntries, type NavEntry } from './store';

// Tokens an entry's url may carry, the same spelling RE621's header tabs use.
// An unknown token is left verbatim.
export function expand(url: string): string {
  const user = currentUser();
  return url.replace(/%(\w+)%/g, (whole, token) => {
    if (token === 'username') return user?.name ?? whole;
    if (token === 'userid') return String(user?.id ?? whole);
    return whole;
  });
}

export function pinnedEntries(): NavEntry[] {
  return listEntries().filter((entry) => entry.pinned);
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
