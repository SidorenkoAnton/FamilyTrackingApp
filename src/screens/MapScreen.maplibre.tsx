/**
 * Нативная версия карты на @maplibre/maplibre-react-native.
 *
 * ВАЖНО: этот экран работает только в development build (нативная сборка),
 * в Expo Go он падает, потому что MapLibre не входит в Expo Go.
 * Чтобы вернуть его, достаточно поменять импорт в src/screens/MapScreen.tsx
 * на `export { MapScreen } from './MapScreen.maplibre';`.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Map, Camera } from '@maplibre/maplibre-react-native'; // 👈 Именованный импорт
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const STYLE_URL = 'https://104.252.111.131:8080/styles/colorful/style.json';

export const MapScreen: React.FC = () => {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={STYLE_URL} // 👈 Проп styleURL переименован в mapStyle
      >
        <Camera
          initialViewState={{ // 👈 Новый способ задания камеры
            center: [39.69902, 47.28869], // [долгота, широта]
            zoom: 14,
          }}
        />
      </Map>

      <View style={styles.overlay}>
        <Button mode="contained" onPress={logout} buttonColor="#f44336">
          Выйти
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
