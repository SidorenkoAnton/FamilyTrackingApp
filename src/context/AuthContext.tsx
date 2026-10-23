import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { authApi } from '../api';
import { setApiToken, setUnauthorizedHandler } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { TOKEN_STORAGE_KEY, USER_CACHE_KEY } from '../constants/config';
import {
  ensureTracking,
  isTrackingStarted,
  isTrackingSupported,
  stopBackgroundTracking,
} from '../services/BackgroundLocationService';
import type { User } from '../types';
import { ApiError } from '../utils/errors';
import {
  hasBackgroundLocationPermission,
  hasForegroundLocationPermission,
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
  requestNotificationPermission,
} from '../utils/permissions';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextData {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isLoading: boolean;
  /** Whether the background service is currently running for this user. */
  trackingActive: boolean;
  /** Whether the user is a child in at least one group (tracking is relevant). */
  isChildRole: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Re-evaluates the child role and starts/stops tracking without prompts. */
  syncTracking: () => Promise<boolean>;
  /** Same as syncTracking, but asks for the required permissions. */
  setupTracking: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [trackingActive, setTrackingActive] = useState(false);
  const [isChildRole, setIsChildRole] = useState(false);
  const sessionExpiredRef = useRef(false);

  const persistUser = useCallback(async (nextUser: User) => {
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(nextUser)).catch(
      () => undefined,
    );
  }, []);

  const clearSession = useCallback(async () => {
    await stopBackgroundTracking();
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => undefined);
    await AsyncStorage.removeItem(USER_CACHE_KEY).catch(() => undefined);
    setApiToken(null);
    setToken(null);
    setUser(null);
    setTrackingActive(false);
    setIsChildRole(false);
    setStatus('guest');
  }, []);

  const handleUnauthorized = useCallback(() => {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true;
    void clearSession().finally(() => {
      sessionExpiredRef.current = false;
    });
    toast.show('Сессия истекла. Войдите снова.', { tone: 'error' });
  }, [clearSession, toast]);

  useEffect(() => setUnauthorizedHandler(handleUnauthorized), [handleUnauthorized]);

  const runTracking = useCallback(async (askPermissions: boolean): Promise<boolean> => {
    if (!isTrackingSupported()) {
      setTrackingActive(false);
      return false;
    }

    if (askPermissions) {
      const foregroundGranted = await requestForegroundLocationPermission();
      if (!foregroundGranted) return false;
      await requestNotificationPermission();
    } else if (!(await hasForegroundLocationPermission())) {
      return false;
    }

    const active = await ensureTracking();
    setTrackingActive(active.active);
    setIsChildRole(active.isChild);

    // Background access is what makes the child visible while the app is
    // closed; ask once, right after the role is known.
    if (active.active && askPermissions && !(await hasBackgroundLocationPermission())) {
      await requestBackgroundLocationPermission();
    }

    return active.active;
  }, []);

  const syncTracking = useCallback(async () => {
    const result = await ensureTracking();
    setTrackingActive(result.active);
    setIsChildRole(result.isChild);
    return result.active;
  }, []);

  const setupTracking = useCallback(() => runTracking(true), [runTracking]);

  // Restore the session: paint from the cached profile first, then refresh it.
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const [storedToken, cachedUserRaw] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_STORAGE_KEY).catch(() => null),
          AsyncStorage.getItem(USER_CACHE_KEY).catch(() => null),
        ]);

        if (!storedToken) {
          if (mounted) setStatus('guest');
          return;
        }

        setApiToken(storedToken);
        const cachedUser = cachedUserRaw ? (JSON.parse(cachedUserRaw) as User) : null;

        if (mounted) {
          setToken(storedToken);
          if (cachedUser) {
            setUser(cachedUser);
            setStatus('authenticated');
          }
        }

        try {
          const freshUser = await authApi.me();
          if (!mounted) return;
          setUser(freshUser);
          setStatus('authenticated');
          await persistUser(freshUser);
        } catch (error) {
          if (!mounted) return;
          if (error instanceof ApiError && error.status === 401) {
            await clearSession();
            return;
          }
          // Offline with a cached profile: keep the user signed in.
          if (!cachedUser) setStatus('guest');
        }

        if (mounted && (await hasForegroundLocationPermission())) {
          const result = await ensureTracking();
          if (mounted) {
            setTrackingActive(result.active);
            setIsChildRole(result.isChild);
          }
        } else if (mounted) {
          setTrackingActive(isTrackingStarted());
        }
      } catch {
        if (mounted) setStatus('guest');
      }
    };

    void restore();

    return () => {
      mounted = false;
    };
  }, [clearSession, persistUser]);

  // Re-check the role when the app returns to the foreground: a parent may
  // have added this device as a "child" from another phone.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        if (await hasForegroundLocationPermission()) {
          const result = await ensureTracking();
          setTrackingActive(result.active);
          setIsChildRole(result.isChild);
        }
      })();
    });

    return () => subscription.remove();
  }, [status]);

  const applyAuth = useCallback(
    async (accessToken: string) => {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, accessToken);
      setApiToken(accessToken);
      setToken(accessToken);

      const me = await authApi.me();
      setUser(me);
      setStatus('authenticated');
      await persistUser(me);
      sessionExpiredRef.current = false;
    },
    [persistUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password);
      await applyAuth(response.access_token);
      // Permission dialogs must never turn a successful login into an error.
      await setupTracking().catch(() => undefined);
    },
    [applyAuth, setupTracking],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await authApi.register(email, password, name);
      await applyAuth(response.access_token);
      await setupTracking().catch(() => undefined);
    },
    [applyAuth, setupTracking],
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    await persistUser(me);
  }, [persistUser]);

  const value = useMemo<AuthContextData>(
    () => ({
      user,
      token,
      status,
      isLoading: status === 'loading',
      trackingActive,
      isChildRole,
      login,
      register,
      logout,
      refreshUser,
      syncTracking,
      setupTracking,
    }),
    [
      user,
      token,
      status,
      trackingActive,
      isChildRole,
      login,
      register,
      logout,
      refreshUser,
      syncTracking,
      setupTracking,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
