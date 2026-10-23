import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { View, type ViewStyle } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { createPaperTheme } from './paper';
import {
  createShadows,
  palettes,
  type AppColors,
  type ShadowLevel,
  type ThemeMode,
} from './tokens';

const THEME_STORAGE_KEY = 'settings.theme-mode';

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  shadows: Record<ShadowLevel, ViewStyle>;
  paperTheme: MD3Theme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'light' || stored === 'dark')) {
          setModeState(stored);
        }
      })
      .catch(() => {
        // A failed preference read should never block the app start.
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<AppTheme>(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      colors: palettes[mode],
      shadows: createShadows(mode),
      paperTheme: createPaperTheme(mode),
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    };
  }, [mode, setMode]);

  if (!ready) {
    // A single frame while the stored preference is read; avoids a theme flash.
    return <View style={{ flex: 1, backgroundColor: palettes.light.background }} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used inside <ThemeProvider>');
  }
  return value;
}
