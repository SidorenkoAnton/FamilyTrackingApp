import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { restartTrackingIfNeeded } from './src/utils/common';

export default function App() {
  useEffect(() => {
    // Проверяем и перезапускаем трекинг при старте приложения
    restartTrackingIfNeeded();
  }, []);
  
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}