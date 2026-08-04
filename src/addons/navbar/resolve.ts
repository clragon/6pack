import { currentUser } from '../../site/user';
import { listEntries, type NavEntry } from './store';

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
