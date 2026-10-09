import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_LOCATION_TASK, startBackgroundTracking } from '../services/BackgroundLocationService';

export const restartTrackingIfNeeded = async () => {
  // Проверяем, запущена ли задача
  const isTracking = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  
  if (isTracking) {
    // Проверяем, получаем ли мы актуальные данные
    const lastKnown = await Location.getLastKnownPositionAsync();
    const now = Date.now();
    
    // Если последняя локация старше 5 минут — трекинг сломан
    if (lastKnown && (now - lastKnown.timestamp) > 5 * 60 * 1000) {
      console.log('[TRACKING] Обнаружен зависший трекинг, перезапускаем...');
      
      // Останавливаем и запускаем заново
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      // Получаем groupId из AsyncStorage
      const groupId = await AsyncStorage.getItem('tracking_group_id');
      if (groupId) {
        await startBackgroundTracking(groupId);
      }
    }
  }
};