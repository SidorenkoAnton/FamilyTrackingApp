import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import LocationTracking from 'location-tracking';
import { groupsApi } from '../api';
import { TOKEN_STORAGE_KEY } from '../constants/config';

/**
 * Bridge to the native foreground location service.
 *
 * The service uploads coordinates to the backend on its own, so the JS side
 * only has to provide the group id + token and start/stop it.
 */

const TRACKING_GROUP_ID_KEY = 'tracking_group_id';

let trackingStarted = false;

/** The native service currently exists for Android only. */
export const isTrackingSupported = (): boolean => Platform.OS === 'android';

type TrackingNativeModule = {
  setCredentials?: (groupId: string, token: string) => void;
  startTracking?: () => void;
  stopTracking?: () => void;
};

const nativeModule = LocationTracking as unknown as TrackingNativeModule | undefined;

const nativeAvailable = () =>
  typeof nativeModule?.setCredentials === 'function' &&
  typeof nativeModule?.startTracking === 'function' &&
  typeof nativeModule?.stopTracking === 'function';

export function isTrackingStarted(): boolean {
  return trackingStarted;
}

export async function getTrackedGroupId(): Promise<string | null> {
  return AsyncStorage.getItem(TRACKING_GROUP_ID_KEY).catch(() => null);
}

export async function startBackgroundTracking(groupId: string): Promise<boolean> {
  if (!isTrackingSupported() || !nativeAvailable() || !groupId) return false;

  const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY).catch(() => null);
  if (!token) return false;

  try {
    await AsyncStorage.setItem(TRACKING_GROUP_ID_KEY, groupId);
    nativeModule?.setCredentials?.(groupId, token);
    if (!trackingStarted) {
      nativeModule?.startTracking?.();
      trackingStarted = true;
    }
    return true;
  } catch (error) {
    console.warn('[tracking] Не удалось запустить трекинг:', error);
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  try {
    if (nativeAvailable()) {
      nativeModule?.stopTracking?.();
    }
  } catch (error) {
    console.warn('[tracking] Не удалось остановить трекинг:', error);
  } finally {
    // Always reset the flag, otherwise re-login can never start tracking again.
    trackingStarted = false;
    await AsyncStorage.removeItem(TRACKING_GROUP_ID_KEY).catch(() => undefined);
  }
}

export interface TrackingSyncResult {
  /** Whether the foreground location service is running. */
  active: boolean;
  /** Whether the current user has the "child" role in at least one group. */
  isChild: boolean;
}

/**
 * Starts tracking when the signed-in user is a child in at least one group and
 * stops it otherwise. Safe to call often: it is idempotent and refreshes the
 * credentials after a re-login.
 *
 * Limitation: the native service stores a single group id, so with several
 * "child" groups only the first one is tracked. Supporting more requires a
 * native change.
 */
export async function ensureTracking(): Promise<TrackingSyncResult> {
  if (!isTrackingSupported() || !nativeAvailable()) {
    return { active: false, isChild: false };
  }

  try {
    const memberships = await groupsApi.list();
    const childMembership = memberships.find((item) => item.role === 'child' && item.group?.id);

    if (!childMembership) {
      if (trackingStarted) await stopBackgroundTracking();
      return { active: false, isChild: false };
    }

    const groupId = childMembership.group.id;
    const storedGroupId = await getTrackedGroupId();

    if (trackingStarted && storedGroupId === groupId) {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY).catch(() => null);
      if (token) nativeModule?.setCredentials?.(groupId, token);
      return { active: true, isChild: true };
    }

    const active = await startBackgroundTracking(groupId);
    return { active, isChild: true };
  } catch (error) {
    console.warn('[tracking] Не удалось синхронизировать трекинг:', error);
    return { active: trackingStarted, isChild: trackingStarted };
  }
}
