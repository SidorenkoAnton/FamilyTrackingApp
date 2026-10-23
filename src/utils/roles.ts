import type { Role, User } from '../types';

/**
 * The backend is not fully consistent about role names ("admin" / "owner" /
 * "administrator") and about how a member references a user. These helpers
 * normalise both, so a wrong guess never hides the main actions from the user.
 */
export function normalizeRole(value?: string | null): Role | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  if (
    normalized === 'admin' ||
    normalized === 'owner' ||
    normalized === 'administrator' ||
    normalized === 'superadmin'
  ) {
    return 'admin';
  }
  if (normalized === 'child' || normalized === 'kid') {
    return 'child';
  }
  if (
    normalized === 'member' ||
    normalized === 'adult' ||
    normalized === 'parent' ||
    normalized === 'user'
  ) {
    return 'member';
  }

  return null;
}

type UserLike = Pick<User, 'id' | 'email'> | null | undefined;

/** Compares users by id (string or number) and falls back to email. */
export function isSameUser(a: UserLike, b: UserLike): boolean {
  if (!a || !b) return false;

  if (a.id != null && b.id != null && String(a.id) === String(b.id)) {
    return true;
  }

  const emailA = a.email?.trim().toLowerCase();
  const emailB = b.email?.trim().toLowerCase();

  return Boolean(emailA && emailB && emailA === emailB);
}
