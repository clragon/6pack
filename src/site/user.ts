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
