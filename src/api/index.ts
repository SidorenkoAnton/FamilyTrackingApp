import type {
  AuthResponse,
  GroupDetail,
  GroupMembership,
  GroupSummary,
  Invite,
  MemberLocation,
  Role,
  User,
} from '../types';
import { normalizeUser } from '../utils/user';
import api from './client';

/** Typed endpoint functions. Screens never build URLs themselves. */

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> =>
    (await api.post<AuthResponse>('/auth/login', { email: email.trim(), password })).data,

  register: async (email: string, password: string, name?: string): Promise<AuthResponse> =>
    (
      await api.post<AuthResponse>('/auth/register', {
        email: email.trim(),
        password,
        ...(name?.trim() ? { name: name.trim() } : {}),
      })
    ).data,

  // /auth/me returns the JWT payload ({ userId, email }), not a User entity.
  me: async (): Promise<User> => normalizeUser((await api.get('/auth/me')).data),
};

export const groupsApi = {
  list: async (): Promise<GroupMembership[]> => {
    const data = (await api.get<GroupMembership[]>('/groups')).data;
    if (!Array.isArray(data)) return [];
    return data.filter((item) => Boolean(item?.group?.id));
  },

  detail: async (groupId: string): Promise<GroupDetail> =>
    (await api.get<GroupDetail>(`/groups/${groupId}`)).data,

  create: async (payload: { name: string; description?: string }): Promise<GroupSummary> =>
    (await api.post<GroupSummary>('/groups', payload)).data,

  remove: async (groupId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  addMember: async (groupId: string, email: string, role: Role): Promise<void> => {
    await api.post(`/groups/${groupId}/members`, { email: email.trim(), role });
  },

  join: async (code: string): Promise<{ group: GroupSummary }> =>
    (await api.post<{ group: GroupSummary }>('/groups/join', { code })).data,

  createInvite: async (
    groupId: string,
    role: Role = 'child',
    expiresInMinutes = 15,
  ): Promise<Invite> =>
    (
      await api.post<Invite>(`/groups/${groupId}/invites`, {
        role,
        expiresInMinutes,
      })
    ).data,
};

export const locationsApi = {
  latest: async (): Promise<MemberLocation[]> => {
    const data = (await api.get<MemberLocation[]>('/locations/latest')).data;
    if (!Array.isArray(data)) return [];

    // Never let one malformed row crash the map.
    return data.filter(
      (item) =>
        Boolean(item?.user?.id) &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude),
    );
  },
};
