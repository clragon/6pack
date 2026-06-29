import { probe } from '../core/diag';

// The current user, read from e621ng's <body> data attributes. e621ng renders
// the full record there on every page (application_helper#body_attributes:
// id, name, numeric level, level string, role flags), so it is available
// synchronously without a fetch.
function userData(key: string): string | null {
  return document.body?.dataset[key] ?? null;
}

export function currentUserId(): number | null {
  const id = userData('userId');
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

export function currentUserName(): string | null {
  return userData('userName');
}

export function canApprovePosts(): boolean {
  return userData('userCanApprovePosts') === 'true';
}

// e621 user levels (app/logical/user_level.rb). Menu entries gate on a
// numeric threshold rather than the canonical `is_<role>?` (which also requires
// is_verified): for UI visibility the level alone is enough and is robust to the
// flag's shape drifting.
export const Level = {
  Member: 20,
  Privileged: 30,
  FormerStaff: 40,
  Staff: 50,
  Janitor: 60,
  Moderator: 70,
  Admin: 80,
} as const;

export interface CurrentUser {
  id: number;
  name: string;
  level: number;
  levelString: string;
  canApprovePosts: boolean;
}

let cached: CurrentUser | null = null;

// Assemble the record from the body attributes. An anonymous or logged-out
// visitor has no id (or the anonymous flag set), and reads as null so gates fall
// through to the logged-out path.
function readUser(): CurrentUser | null {
  const id = currentUserId();
  if (id == null || userData('userIsAnonymous') === 'true') return null;
  const level = Number(userData('userLevel'));
  if (!Number.isFinite(level)) return null;
  return {
    id,
    name: currentUserName() ?? '',
    level,
    levelString: userData('userLevelString') ?? '',
    canApprovePosts: canApprovePosts(),
  };
}

// Kept for call sites that preloaded the record; now a synchronous read wrapped
// in a resolved promise. Caches only a real user, so an early read before the
// body exists re-reads rather than pinning null.
export function loadCurrentUser(): Promise<CurrentUser | null> {
  return Promise.resolve(currentUser());
}

// Synchronous view of the record for `when` predicates and diagnostics.
export function currentUser(): CurrentUser | null {
  if (!cached) cached = readUser();
  return cached;
}

function atLeast(level: number): boolean {
  return cached != null && cached.level >= level;
}

export const isModeratorPlus = probe('moderator+', (): boolean =>
  atLeast(Level.Moderator),
);

export function isAdmin(): boolean {
  return atLeast(Level.Admin);
}
