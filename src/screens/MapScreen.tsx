import React, { useCallback, useState } from 'react';
import * as Updates from 'expo-updates';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';
import { Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const STYLE_URL = 'https://104.252.111.131/tiles/styles/colorful/style.json';

interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const MapScreen: React.FC = () => {
  const { logout } = useAuth();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');

  const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } else {
      alert('Обновлений нет');
    }
  } catch (error: any) {
    alert(`Ошибка: ${error.message}`);
  }
};

  const loadLocations = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/locations/latest');
      setLocations(response.data);
      console.log('[MAP] Локации:', response.data);
    } catch (e: any) {
      console.error('[MAP] Ошибка загрузки локаций:', e);
      setError(e.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      if (initial) {
        setLoading(false);
      }
    }
  }, []);

  // 👇 Обновляем карту при каждом открытии экрана и раз в 15 секунд
  useFocusEffect(
    useCallback(() => {
      loadLocations(true);
      const intervalId = setInterval(() => loadLocations(false), 15000);
      return () => clearInterval(intervalId);
    }, [loadLocations]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Загружаем данные...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={STYLE_URL}
      >
        <Camera
          initialViewState={{
            center: [39.69902, 47.28869], // Ростов-на-Дону
            zoom: 12,
          }}
        />

        {/* 👇 Маркеры для каждой локации */}
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            id={loc.id}
            lngLat={[loc.longitude, loc.latitude]}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>
                {loc.user?.name || 'Ребёнок'}
              </Text>
              <Text style={styles.markerTime}>
                {new Date(loc.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
          </Marker>
        ))}
      </Map>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {locations.length === 0 ? (
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyText}>
            Локаций пока нет. Убедитесь, что участник в роли «Ребёнок» выдал
            разрешение на геолокацию и открыл приложение.
          </Text>
        </View>
      ) : null}

      <View style={styles.overlay}>
        <Button
          mode="contained"
          onPress={() => loadLocations(false)}
          style={{ marginBottom: 10 }}
        >
          Обновить
        </Button>
        {trackingMessage ? (
          <Text style={styles.trackingMessage}>{trackingMessage}</Text>
        ) : null}
        <Button mode="outlined" onPress={logout} textColor="#f44336">
          Выйти
        </Button>
        <Button onPress={checkForUpdates}>Проверить обновления</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  markerTime: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  errorBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
  },
  emptyBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  trackingMessage: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});