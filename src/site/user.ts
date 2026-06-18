import { probe } from '../core/diag';

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

// Values from e621ng's app/logical/user_level.rb.
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
