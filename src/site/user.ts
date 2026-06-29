import { probe } from '../core/diag';

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

// Values from e621ng's app/logical/user_level.rb.
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

export function loadCurrentUser(): Promise<CurrentUser | null> {
  return Promise.resolve(currentUser());
}

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
