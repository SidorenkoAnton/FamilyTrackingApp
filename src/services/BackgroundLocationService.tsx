import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import LocationTracking from 'location-tracking'
import * as SecureStore from 'expo-secure-store';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

// 👇 Ключ, под которым храним groupId для фоновой задачи
const TRACKING_GROUP_ID_KEY = 'tracking_group_id';

// 🧭 Единая точка отправки координат (используют и фоновая задача, и foreground-режим)
// Дубли одной и той же точки в течение 5 секунд не отправляем: на старте точку
// может отдать и мгновенный запрос позиции, и фоновая задача, и foreground-подписка.
const SEND_THROTTLE_MS = 5000;
let lastSent: { latitude: number; longitude: number; at: number } | null = null;
console.log('[NATIVE] LocationTracking модуль:', LocationTracking);

async function pushLocation(
  coords: Location.LocationObjectCoords,
  groupId?: string | null,
) {
  const now = Date.now();
  const isSameSpotAsRecentlySent =
    lastSent !== null &&
    now - lastSent.at < SEND_THROTTLE_MS &&
    Math.abs(lastSent.latitude - coords.latitude) < 1e-6 &&
    Math.abs(lastSent.longitude - coords.longitude) < 1e-6;

  if (isSameSpotAsRecentlySent) {
    console.log('[TRACKING] Пропускаем дубль координат');
    return;
  }

  const targetGroupId =
    groupId ?? (await AsyncStorage.getItem(TRACKING_GROUP_ID_KEY));

  if (!targetGroupId) {
    console.warn('[TRACKING] groupId не найден — отправка координат пропущена');
    return;
  }

  try {
    await api.post('/locations', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
      groupId: targetGroupId,
    });
    lastSent = { latitude: coords.latitude, longitude: coords.longitude, at: now };
    console.log(
      '[TRACKING] Координаты отправлены:',
      coords.latitude,
      coords.longitude,
      'в группу',
      targetGroupId,
    );
  } catch (e: any) {
    console.error(
      '[TRACKING] Ошибка отправки координат:',
      e?.response?.status,
      e?.response?.data?.message || e?.message || e,
    );
  }
}

// Регистрируем задачу (выполняется в фоне)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  console.log('[TRACKING-TASK] Задача вызвана!');
  if (error) {
    console.error('[TRACKING-TASK] Ошибка фонового трекинга:', error);
    return;
  }

  const { locations } = (data ?? {}) as {
    locations?: Location.LocationObject[];
  };

  if (!locations?.length) {
    console.warn('[TRACKING-TASK] Задача вызвана без координат');
    return;
  }

  console.log('[TRACKING-TASK] Получено позиций:', locations.length);
  await pushLocation(locations[locations.length - 1].coords);
});

// 👇 Foreground-подписка. В отличие от фоновой задачи здесь опции
// timeInterval/distanceInterval применяются корректно, поэтому она умеет
// отправлять позицию даже когда устройство стоит на месте.
let foregroundSubscription: Location.LocationSubscription | null = null;

export async function startForegroundUpdates(groupId: string) {
  if (foregroundSubscription) {
    console.log('[TRACKING] Foreground-обновления уже запущены');
    return;
  }

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000,
      distanceInterval: 0, // 0 — присылать позицию, даже если устройство не двигается
    },
    (location) => {
      void pushLocation(location.coords, groupId);
    },
  );

  console.log('[TRACKING] Foreground-обновления запущены');
}

export function stopForegroundUpdates() {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
    console.log('[TRACKING] Foreground-обновления остановлены');
  }
}

// 🚀 Одноразовая отправка текущей позиции (чтобы точка появилась сразу)
export async function pushCurrentLocation(groupId?: string | null) {
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    await pushLocation(current.coords, groupId);
  } catch (e: any) {
    console.warn(
      '[TRACKING] Не удалось получить текущую позицию:',
      e?.message || e,
    );
  }
}

// Запуск трекинга
export async function startBackgroundTracking(groupId: string) {
  console.log('[TRACKING] startBackgroundTracking вызван с groupId:', groupId);

 // 👇 Сохраняем groupId, чтобы задача могла его прочитать
  await AsyncStorage.setItem(TRACKING_GROUP_ID_KEY, groupId);

  // 👇 Передаём groupId и token в нативный сервис
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) {
    console.warn('[TRACKING] Токен не найден — нативный трекинг не запустится');
  } else {
    LocationTracking.setCredentials(groupId, token);
  }

  LocationTracking.startTracking();

  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  console.log('[TRACKING] foregroundStatus:', foregroundStatus);
  if (foregroundStatus !== 'granted') {
    throw new Error('Разрешение на геолокацию не получено');
  }

  // 1. Сразу отправляем текущую позицию, не дожидаясь движения устройства
  await pushCurrentLocation(groupId);

  // 2. Foreground-обновления (работают и когда устройство стоит на месте)
  await startForegroundUpdates(groupId);

  // 3. Фоновые обновления (нужны, когда приложение свёрнуто или закрыто).
  //    ⚠️ На Android 11+ «Разрешить всегда» включается только в настройках
  //    приложения, поэтому статус может остаться denied — в этом случае
  //    трекинг продолжит работать в foreground-режиме.
  const backgroundPermission = await Location.getBackgroundPermissionsAsync();
  let backgroundStatus = backgroundPermission.status;
  console.log('[TRACKING] backgroundStatus (до запроса):', backgroundStatus);

  if (backgroundStatus !== 'granted') {
    const requested = await Location.requestBackgroundPermissionsAsync();
    backgroundStatus = requested.status;
    console.log(
      '[TRACKING] backgroundStatus (после запроса):',
      backgroundStatus,
    );
  }

  // Перезапускаем задачу, чтобы в ней не остался старый groupId
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }

  console.log(
    '[TRACKING] Запускаем startLocationUpdatesAsync с groupId:',
    groupId,
  );
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 50,
    timeInterval: 30000,
    deferredUpdatesInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Family Tracker',
      notificationBody: 'Отслеживание местоположения активно',
    },
    pausesUpdatesAutomatically: false,
  });

  console.log(
    '[TRACKING] Фоновая задача запущена (background permission =',
    backgroundStatus,
    ')',
  );
}

// Остановка трекинга
export async function stopBackgroundTracking() {
  stopForegroundUpdates();

  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  await AsyncStorage.removeItem(TRACKING_GROUP_ID_KEY);
  console.log('[TRACKING] Трекинг остановлен');
}

// Идемпотентная проверка: если пользователь — ребёнок в какой-то группе,
// трекинг должен быть запущен. Безопасно вызывать повторно (при старте
// приложения, после логина и при возврате приложения в foreground).
export async function ensureTracking() {
  try {
    console.log('[TRACKING] Проверяем, является ли пользователь ребёнком...');
    const groupsResponse = await api.get('/groups');
    const groups = groupsResponse.data;
    console.log('[TRACKING] Группы:', JSON.stringify(groups));

    const childGroups = groups.filter((g: any) => g.role === 'child');
    console.log(
      '[TRACKING] Групп, где пользователь ребёнок:',
      childGroups.length,
    );

    if (!childGroups.length) {
      console.log(
        '[TRACKING] Пользователь не является ребёнком ни в одной группе — трекинг не нужен',
      );
      return;
    }

    const groupId = childGroups[0].group?.id;
    if (!groupId) {
      console.warn('[TRACKING] Не удалось определить groupId группы ребёнка');
      return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK,
    );
    const storedGroupId = await AsyncStorage.getItem(TRACKING_GROUP_ID_KEY);
    console.log(
      '[TRACKING] Трекинг уже запущен?',
      hasStarted,
      '| groupId:',
      storedGroupId,
    );

    if (hasStarted && storedGroupId === groupId && foregroundSubscription) {
      console.log('[TRACKING] Трекинг уже запущен для этой группы');
      return;
    }

    await startBackgroundTracking(groupId);
    console.log(
      '[TRACKING] Автоматический трекинг запущен для группы:',
      childGroups[0].group?.name,
    );
  } catch (e: any) {
    console.error(
      '[TRACKING] Ошибка автозапуска трекинга:',
      e?.response?.data?.message || e?.message || e,
    );
  }
}