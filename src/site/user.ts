import { probe } from '../core/diag';

// The current user, from e621's <meta> tags plus a one-shot /users/<id>.json
// fetch. The meta tags cover the cheap sync checks; level and role flags live
// only in the JSON.
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

// e621 user levels (config/danbooru_default_config.rb). Menu entries gate on a
// numeric threshold rather than the canonical `is_<role>?` (which also requires
// is_verified): for UI visibility the level alone is enough and is robust to the
// flag's shape drifting.
export const Level = {
  Member: 20,
  Privileged: 30,
  FormerStaff: 34,
  Janitor: 35,
  Moderator: 40,
  Admin: 50,
} as const;

export interface CurrentUser {
  id: number;
  name: string;
  level: number;
  levelString: string;
  canApprovePosts: boolean;
  isVerified: boolean;
}

interface RawUser {
  id: number;
  name: string;
  level: number;
  level_string: string;
  can_approve_posts: boolean;
  is_verified: boolean;
}

let cached: CurrentUser | null = null;
let inFlight: Promise<CurrentUser | null> | null = null;

// Fetch the logged-in user's record once. Level and role flags ship only in
// /users/<id>.json, not in <meta>. Cached for the session; a failure (logged
// out, network) resolves to null and leaves the cache empty so a later call can
// retry.
export function loadCurrentUser(): Promise<CurrentUser | null> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  const id = currentUserId();
  if (id == null) return Promise.resolve(null);
  inFlight = fetch(`/users/${id}.json`, { credentials: 'same-origin' })
    .then((res) => (res.ok ? (res.json() as Promise<unknown>) : null))
    .then((data) => {
      const user = data as Partial<RawUser> | null;
      if (
        !user ||
        typeof user.id !== 'number' ||
        typeof user.level !== 'number'
      ) {
        return null;
      }
      cached = {
        id: user.id,
        name: user.name ?? '',
        level: user.level,
        levelString: user.level_string ?? '',
        canApprovePosts: !!user.can_approve_posts,
        isVerified: !!user.is_verified,
      };
      return cached;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// Synchronous view of the cached record for `when` predicates. Null until the
// startup preload resolves; the palette re-resolves actions on every open, so a
// gated action simply appears once the fetch lands.
export function currentUser(): CurrentUser | null {
  return cached;
}

function atLeast(level: number): boolean {
  return cached != null && cached.level >= level;
}

export function isJanitorPlus(): boolean {
  return atLeast(Level.Janitor);
}

export const isModeratorPlus = probe('moderator+', (): boolean =>
  atLeast(Level.Moderator),
);

export function isAdmin(): boolean {
  return atLeast(Level.Admin);
}
