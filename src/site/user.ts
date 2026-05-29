// The current user, from e621's <meta> tags. Enough to gate permission-bound
// actions; deeper level/role info would need /users/me.json.
function meta(name: string): string | null {
  return (
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ??
    null
  );
}

export function currentUserId(): number | null {
  const id = meta('current-user-id');
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

export function currentUserName(): string | null {
  return meta('current-user-name');
}

export function canApprovePosts(): boolean {
  return meta('current-user-can-approve-posts') === 'true';
}
