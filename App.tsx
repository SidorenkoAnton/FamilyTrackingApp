import React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { ToastProvider } from './src/components/ui';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useAppTheme } from './src/design';
import { AppNavigator } from './src/navigation/AppNavigator';

function ThemedApp() {
  const { paperTheme, isDark } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        <ToastProvider>
          <AuthProvider>
            <AppErrorBoundary>
              <AppNavigator />
            </AppErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </View>
    </PaperProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  // Rendering with a missing icon font produces empty squares, so wait for it.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#F4F6FB' }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
