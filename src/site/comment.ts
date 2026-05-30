export async function resolveCommentUrl(id: number): Promise<string | null> {
  try {
    const res = await fetch(`/comments/${id}.json`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = (await res.json()) as { post_id?: number };
    if (typeof data.post_id !== 'number') return null;
    return `/posts/${data.post_id}#comment-${id}`;
  } catch {
    return null;
  }
}
