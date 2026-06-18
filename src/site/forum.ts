// Resolve a forum post to its in-topic URL:
// /forum_topics/<topic>?page=<n>#forum_post_<id>. e621 computes the page number
// server-side (ForumPost#forum_topic_page) and renders the finished link on the
// standalone /forum_posts/<id> page, so we scrape that link rather than recompute
// the pagination (which would need a record count the JSON API doesn't expose).
// An original post redirects to its topic; that page carries the same
// self-anchored link, so one selector covers both cases.
async function fetchForumPostUrl(id: number): Promise<string | null> {
  try {
    const res = await fetch(`/forum_posts/${id}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Ends-with, not contains: #forum_post_49 must not match #forum_post_493.
    const link = doc.querySelector<HTMLAnchorElement>(
      `a[href$="#forum_post_${id}"]`,
    );
    const href = link?.getAttribute('href');
    if (href) return href;
    // No self-anchored link (unexpected): fall back to the resolved topic URL.
    const url = new URL(res.url, window.location.origin);
    if (url.pathname.startsWith('/forum_topics/')) {
      return `${url.pathname}${url.search}#forum_post_${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

const pending = new Map<number, Promise<string | null>>();
const resolved = new Map<number, string>();

// Memoized: one fetch per id. Successes are cached so a warmed lookup is instant;
// failures are not, so they stay retryable on the next call.
export function resolveForumPostUrl(id: number): Promise<string | null> {
  const done = resolved.get(id);
  if (done !== undefined) return Promise.resolve(done);
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;
  const promise = fetchForumPostUrl(id).then((url) => {
    if (url) resolved.set(id, url);
    pending.delete(id);
    return url;
  });
  pending.set(id, promise);
  return promise;
}

// The resolved URL if a prior call already succeeded, else undefined. Lets a
// command open a new tab pointed straight at the destination when the prefetch
// has landed, skipping the blank-then-redirect dance.
export function cachedForumPostUrl(id: number): string | undefined {
  return resolved.get(id);
}
