import type { User } from '../types';

type RawUser = {
  id?: unknown;
  userId?: unknown;
  sub?: unknown;
  email?: unknown;
  name?: unknown;
};

/**
 * The backend returns the JWT payload from GET /auth/me: `{ userId, email }`.
 * The rest of the app (role checks, owner checks, avatars) works with `id`,
 * so every user object is normalised at the API boundary.
 */
export function normalizeUser(raw: unknown): User {
  const record = (raw ?? {}) as RawUser;
  const idValue = record.id ?? record.userId ?? record.sub;

  return {
    id: idValue != null ? String(idValue) : '',
    email: typeof record.email === 'string' ? record.email : '',
    name:
      typeof record.name === 'string' && record.name.trim() ? record.name.trim() : null,
  };
}

/** Human name with a sensible fallback while /auth/me has no `name` field. */
export function displayName(user?: Pick<User, 'name' | 'email'> | null): string {
  const name = user?.name?.trim();
  if (name) return name;

  const email = user?.email?.trim();
  if (email) return email.split('@')[0];

  return 'Без имени';
}
