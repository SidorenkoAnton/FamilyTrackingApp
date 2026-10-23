import appConfig from '../../app.json';

/**
 * Runtime configuration.
 *
 * The API base URL can be overridden without touching code by creating a
 * `.env.local` file with:
 *   EXPO_PUBLIC_API_URL=https://your-api.example.com/api
 *   EXPO_PUBLIC_MAP_STYLE_URL=https://your-tiles.example.com/styles/style.json
 *
 * Note: the native Android foreground service still contains its own copy of
 * the upload URL (modules/location-tracking/android/.../LocationTrackingService.kt).
 * Change both when moving the backend.
 */
const DEFAULT_API_URL = 'https://104.252.111.131/api';
const DEFAULT_MAP_STYLE_URL = 'https://104.252.111.131/tiles/styles/colorful/style.json';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
export const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? DEFAULT_MAP_STYLE_URL;

/** Fallback map view when there is nothing to fit: Rostov-on-Don. */
export const INITIAL_MAP_CENTER: [number, number] = [39.69902, 47.28869];
export const INITIAL_MAP_ZOOM = 11.5;

/** How often the map re-fetches member positions while it is focused. */
export const LOCATION_POLL_INTERVAL_MS = 20_000;
/** A member is shown as online if their last update is newer than this. */
export const ONLINE_THRESHOLD_MS = 3 * 60_000;

export const INVITE_TTL_MINUTES = 15;
export const INVITE_CODE_LENGTH = 6;

export const TOKEN_STORAGE_KEY = 'access_token';
export const USER_CACHE_KEY = 'auth.user';

export const APP_VERSION: string = appConfig.expo.version ?? '1.0.0';
export const APP_NAME = 'Family Tracker';
