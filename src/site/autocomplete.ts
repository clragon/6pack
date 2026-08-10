import type { SearchSuggestion } from '../core/actions/types';

// e621 publishes the metatag/category vocabularies as <meta> tags, and we read
// the same ones so our autocomplete matches the site's.
function metaList(name: string): string[] {
  const content =
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ??
    '[]';
  try {
    return JSON.parse(content) as string[];
  } catch {
    return [];
  }
}

let metatagsCache: string[] | null = null;
let orderCache: string[] | null = null;
let categoriesCache: string[] | null = null;
const metatagNames = () => (metatagsCache ??= metaList('metatags'));
const orderMetatags = () => (orderCache ??= metaList('order-metatags'));
const tagCategories = () => (categoriesCache ??= metaList('tag-categories'));

function staticMetatags(): Record<string, string[]> {
  return {
    order: orderMetatags(),
    status: ['any', 'deleted', 'active', 'pending', 'flagged', 'modqueue'],
    rating: ['safe', 'questionable', 'explicit'],
    locked: ['rating', 'note', 'status'],
    child: ['any', 'none'],
    parent: ['any', 'none'],
    filetype: ['jpg', 'png', 'gif', 'swf', 'webm', 'mp4', 'webp'],
    type: ['jpg', 'png', 'gif', 'swf', 'webm', 'mp4', 'webp'],
  };
}

const USER_METATAGS = new Set([
  'user',
  'approver',
  'commenter',
  'comm',
  'noter',
  'noteupdater',
  'fav',
  'favoritedby',
  'flagger',
  'upvote',
  'downvote',
]);

const CATEGORY_NAMES: Record<number, string> = {
  0: 'general',
  1: 'artist',
  2: 'contributor',
  3: 'copyright',
  4: 'character',
  5: 'species',
  6: 'invalid',
  7: 'meta',
  8: 'lore',
};

const humanize = (name: string) => name.replace(/_/g, ' ');
const compact = (n: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
    .format(n)
    .toLowerCase();

interface Parsed {
  metatag: string;
  term: string;
  prefix: string;
}

// Parse the token under the (end-of-string) caret: strip a -/~ prefix, then
// split a leading metatag:/category: off the rest.
function parseActiveToken(text: string): Parsed | null {
  const match = text.match(/\S+$/);
  if (!match) return null;
  let term = match[0];
  let prefix = '';
  const prefixMatch = term.match(/^([-~]+)(.*)$/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    term = prefixMatch[2];
  }
  let metatag = '';
  const colon = term.indexOf(':');
  if (colon > 0) {
    const name = term.slice(0, colon).toLowerCase();
    if (metatagNames().includes(name) || tagCategories().includes(name)) {
      metatag = name;
      term = term.slice(colon + 1);
    }
  }
  return { metatag, term, prefix };
}

async function fetchJson(url: string): Promise<unknown[]> {
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getTags(term: string): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({
    'search[name_matches]': term,
    expiry: '7',
  });
  const data = (await fetchJson(`/tags/autocomplete.json?${params}`)) as Array<{
    name: string;
    post_count?: number;
    category?: number;
  }>;
  return data.map((tag) => ({
    value: tag.name,
    label: humanize(tag.name),
    detail:
      typeof tag.post_count === 'number' ? compact(tag.post_count) : undefined,
    category: tag.category != null ? CATEGORY_NAMES[tag.category] : undefined,
  }));
}

async function getUsers(
  metatag: string,
  term: string,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({
    'search[order]': 'post_upload_count',
    'search[name_matches]': term + '*',
    limit: '10',
  });
  const data = (await fetchJson(`/users.json?${params}`)) as Array<{
    name: string;
  }>;
  return data.map((user) => ({
    value: `${metatag}:${user.name}`,
    label: `${metatag}:${humanize(user.name)}`,
  }));
}

async function getPools(
  metatag: string,
  term: string,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({
    'search[order]': 'post_count',
    'search[name_matches]': term,
    limit: '10',
  });
  const data = (await fetchJson(`/pools.json?${params}`)) as Array<{
    name: string;
    post_count?: number;
  }>;
  return data.map((pool) => ({
    value: `${metatag}:${pool.name}`,
    label: `${metatag}:${humanize(pool.name)}`,
    detail:
      typeof pool.post_count === 'number'
        ? compact(pool.post_count)
        : undefined,
    category: 'pool',
  }));
}

function getStaticMetatag(metatag: string, term: string): SearchSuggestion[] {
  const lower = term.toLowerCase();
  return (staticMetatags()[metatag] ?? [])
    .filter((option) => option.startsWith(lower))
    .slice(0, 10)
    .map((option) => ({
      value: `${metatag}:${option}`,
      label: `${metatag}:${option}`,
      category: 'meta',
    }));
}

async function getMetatags(
  metatag: string,
  term: string,
): Promise<SearchSuggestion[]> {
  if (staticMetatags()[metatag]) return getStaticMetatag(metatag, term);
  if (USER_METATAGS.has(metatag)) return getUsers(metatag, term);
  if (metatag === 'pool') return getPools(metatag, term);
  // Category prefixes (artist:, character:, …) just autocomplete as tags.
  if (tagCategories().includes(metatag)) return getTags(term);
  return [];
}

export async function suggestTagQuery(
  query: string,
): Promise<SearchSuggestion[]> {
  const parsed = parseActiveToken(query);
  if (!parsed) return [];
  const { metatag, term, prefix } = parsed;
  // Plain tags need a few characters, and metatag values can show immediately.
  if (!metatag && term.length < 3) return [];

  let results = metatag
    ? await getMetatags(metatag, term)
    : await getTags(term);
  if (prefix) {
    results = results.map((item) => ({ ...item, value: prefix + item.value }));
  }
  return results.slice(0, 8);
}
