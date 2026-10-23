/** Shared API models. Mirrors the backend response shapes 1:1. */

export type Role = 'admin' | 'member' | 'child';

/** How fresh a member's last location is. */
export type PresenceStatus = 'online' | 'recent' | 'offline' | 'unknown';

export interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  access_token: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string;
}

/** One row of GET /groups — the group plus the current user's role. */
export interface GroupMembership {
  id: string;
  /** owner | superadmin | admin | member | child — normalised in the UI layer. */
  role: string;
  group: GroupSummary;
}

export interface GroupMember {
  id: string;
  /** owner | superadmin | admin | member | child — normalised in the UI layer. */
  role: string;
  user: User;
}

/** GET /groups/:id */
export interface GroupDetail extends GroupSummary {
  members: GroupMember[];
}

/** POST /groups/:id/invites */
export interface Invite {
  code: string;
  expiresAt: string;
  role?: Role;
}

/** GET /locations/latest */
export interface MemberLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  batteryLevel?: number | null;
  createdAt: string;
  updatedAt: string;
  user: User;
}
