import { LocationManager } from '@maplibre/maplibre-react-native';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  type Permission,
} from 'react-native';

const ANDROID_VERSION = Platform.OS === 'android' ? Number(Platform.Version) : 0;

const FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
const BACKGROUND = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
const NOTIFICATIONS = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;

export interface LocationPermissionSummary {
  foreground: boolean;
  background: boolean;
}

/** Foreground access to the device location (needed for the map dot). */
export async function hasForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await PermissionsAndroid.check(FINE as Permission);
  } catch {
    return false;
  }
}

/**
 * "Allow all the time" access. Required for the background tracking service,
 * otherwise Android pauses location updates as soon as the app is closed.
 */
export async function hasBackgroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (ANDROID_VERSION < 29) return hasForegroundLocationPermission();
  try {
    return await PermissionsAndroid.check(BACKGROUND as Permission);
  } catch {
    return false;
  }
}

export async function getLocationPermissionSummary(): Promise<LocationPermissionSummary> {
  const [foreground, background] = await Promise.all([
    hasForegroundLocationPermission(),
    hasBackgroundLocationPermission(),
  ]);
  return { foreground, background };
}

export function confirm(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      options.title,
      options.message,
      [
        { text: options.cancelLabel ?? 'Не сейчас', style: 'cancel', onPress: () => finish(false) },
        { text: options.confirmLabel ?? 'Разрешить', onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}

/**
 * Foreground permission. Only call from a user gesture (login, button press):
 * Android shows the system dialog at most twice.
 */
export async function requestForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    try {
      return await LocationManager.requestPermissions();
    } catch {
      return false;
    }
  }

  if (Platform.OS !== 'android') return false;

  try {
    const result = await PermissionsAndroid.requestMultiple([FINE, COARSE]);
    return result[FINE] === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Background permission with the rationale Android requires before the
 * request. On Android 11+ the system may not show a dialog and the user has to
 * enable "Allow all the time" in Settings — the caller should then offer
 * `openAppSettings()`.
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (ANDROID_VERSION < 29) return hasForegroundLocationPermission();
  if (await hasBackgroundLocationPermission()) return true;

  const agreed = await confirm({
    title: 'Отслеживание в фоне',
    message:
      'Чтобы родители видели ваше местоположение, когда приложение свёрнуто, разрешите доступ к геолокации «В любое время».',
    confirmLabel: 'Продолжить',
  });
  if (!agreed) return false;

  try {
    const result = await PermissionsAndroid.request(BACKGROUND as Permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Android 13+ requires this for the foreground-service notification. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || ANDROID_VERSION < 33) return true;

  try {
    const result = await PermissionsAndroid.request(NOTIFICATIONS as Permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}
