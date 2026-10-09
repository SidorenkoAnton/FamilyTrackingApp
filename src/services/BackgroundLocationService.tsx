import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import LocationTracking from 'location-tracking';

const TRACKING_GROUP_ID_KEY = 'tracking_group_id';
let isTrackingStarted = false;

export async function startBackgroundTracking(groupId: string) {
  if (isTrackingStarted) {
    console.log('[TRACKING] Трекинг уже запущен — пропускаем');
    return;
  }
  await AsyncStorage.setItem(TRACKING_GROUP_ID_KEY, groupId);
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) return;
  LocationTracking.setCredentials(groupId, token);
  LocationTracking.startTracking();
  isTrackingStarted = true;
}

export async function stopBackgroundTracking() {
  LocationTracking.stopTracking();
  await AsyncStorage.removeItem(TRACKING_GROUP_ID_KEY);
}

export async function ensureTracking() {
  try {
    const groupsResponse = await api.get('/groups');
    const groups = groupsResponse.data;
    const childGroups = groups.filter((g: any) => g.role === 'child');
    if (!childGroups.length) return;
    const groupId = childGroups[0].group?.id;
    if (!groupId) return;
    await startBackgroundTracking(groupId);
  } catch (e: any) {
    console.error('[TRACKING] Ошибка:', e?.message || e);
  }
}