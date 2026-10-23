import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { palettes, radius, type ThemeMode } from './tokens';

/**
 * Maps our design tokens onto the React Native Paper (Material 3) theme, so
 * every Paper component (TextInput, Menu, Snackbar, SegmentedButtons, ...)
 * automatically follows the app palette and dark mode.
 */
export function createPaperTheme(mode: ThemeMode): MD3Theme {
  const colors = palettes[mode];
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    roundness: radius.md,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primarySoft,
      onPrimaryContainer: colors.onPrimarySoft,
      secondary: colors.info,
      onSecondary: '#FFFFFF',
      secondaryContainer: colors.infoSoft,
      onSecondaryContainer: colors.info,
      tertiary: colors.success,
      onTertiary: '#FFFFFF',
      tertiaryContainer: colors.successSoft,
      onTertiaryContainer: colors.success,
      error: colors.danger,
      onError: '#FFFFFF',
      errorContainer: colors.dangerSoft,
      onErrorContainer: colors.danger,
      background: colors.background,
      onBackground: colors.text,
      surface: colors.surface,
      onSurface: colors.text,
      surfaceVariant: colors.surfaceMuted,
      onSurfaceVariant: colors.textSecondary,
      surfaceDisabled: colors.surfaceMuted,
      onSurfaceDisabled: colors.textTertiary,
      outline: colors.borderStrong,
      outlineVariant: colors.border,
      shadow: colors.shadow,
      scrim: colors.scrim,
      backdrop: colors.scrim,
      inverseSurface: colors.surfaceInverse,
      inverseOnSurface: colors.textInverse,
      inversePrimary: colors.primary,
      elevation: {
        ...base.colors.elevation,
        level1: colors.surface,
        level2: colors.surface,
        level3: colors.surface,
        level4: colors.surface,
        level5: colors.surface,
      },
    },
  };
}
