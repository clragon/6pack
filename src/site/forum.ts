export async function resolveForumPostUrl(id: number): Promise<string | null> {
  try {
    const res = await fetch(`/forum_posts/${id}`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link = doc.querySelector<HTMLAnchorElement>(`a[href$="#forum_post_${id}"]`);
    const href = link?.getAttribute('href');
    if (href) return href;
    // ForumPostsController#show redirects an original post to its topic page.
    const url = new URL(res.url, window.location.origin);
    if (url.pathname.startsWith('/forum_topics/')) {
      return `${url.pathname}${url.search}#forum_post_${id}`;
    }
    return null;
  } catch {
    return null;
  }
}
