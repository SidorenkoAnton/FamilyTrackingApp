import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens for the whole app.
 *
 * Rules:
 * - Screens never hardcode hex colors, spacing or font sizes.
 * - Every value comes from this file, so the visual language stays consistent
 *   and a redesign only has to touch one place.
 */

export type ThemeMode = 'light' | 'dark';

export interface AppColors {
  /** App background behind cards. */
  background: string;
  /** Cards, sheets, header surfaces. */
  surface: string;
  /** Secondary background for inputs, chips, pressed states. */
  surfaceMuted: string;
  /** Inverse surface for toasts and emphasis blocks. */
  surfaceInverse: string;
  /** Translucent panel used above the map. */
  surfaceFloating: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  onPrimarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  shadow: string;
  scrim: string;
  skeleton: string;
}

const lightColors: AppColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF3F9',
  surfaceInverse: '#0F172A',
  surfaceFloating: 'rgba(255, 255, 255, 0.97)',
  border: '#E4E9F2',
  borderStrong: '#CFD7E3',
  text: '#0F172A',
  textSecondary: '#4B5A6E',
  textTertiary: '#5E6C82',
  textInverse: '#FFFFFF',
  primary: '#3D6DF3',
  primaryPressed: '#3159CC',
  primarySoft: '#EBF1FF',
  onPrimary: '#FFFFFF',
  onPrimarySoft: '#2C5BE0',
  success: '#067647',
  successSoft: '#E6F7EF',
  warning: '#B54708',
  warningSoft: '#FEF3E2',
  danger: '#B42318',
  dangerSoft: '#FDECEC',
  info: '#0B6AAE',
  infoSoft: '#E7F4FD',
  shadow: '#0F172A',
  scrim: 'rgba(15, 23, 42, 0.48)',
  skeleton: '#E7ECF4',
};

const darkColors: AppColors = {
  background: '#0A0E17',
  surface: '#121826',
  surfaceMuted: '#1B2433',
  surfaceInverse: '#F4F6FB',
  surfaceFloating: 'rgba(18, 24, 38, 0.97)',
  border: '#263044',
  borderStrong: '#37455E',
  text: '#ECF1F9',
  textSecondary: '#A2B0C4',
  textTertiary: '#8493A9',
  textInverse: '#0A0E17',
  primary: '#7E9DFF',
  primaryPressed: '#9DB4FF',
  primarySoft: '#1B2740',
  onPrimary: '#08122B',
  onPrimarySoft: '#A9BEFF',
  success: '#3DDC97',
  successSoft: '#12301F',
  warning: '#F5B544',
  warningSoft: '#33260F',
  danger: '#FF7B72',
  dangerSoft: '#35181A',
  info: '#5BB8F5',
  infoSoft: '#102A38',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.62)',
  skeleton: '#1E2738',
};

export const palettes: Record<ThemeMode, AppColors> = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  tabBarHeight: 58,
  minTouchTarget: 44,
  maxContentWidth: 560,
} as const;

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'subhead'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline'
  | 'code';

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  subhead: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.9 },
  code: { fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: 10 },
};

export type ShadowLevel = 'card' | 'floating' | 'sheet';

/**
 * React Native shadows are invisible on very dark surfaces, so the dark theme
 * relies on borders and lower-opacity, larger shadows instead.
 */
export function createShadows(mode: ThemeMode): Record<ShadowLevel, ViewStyle> {
  const isDark = mode === 'dark';
  return {
    card: {
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.05,
      shadowRadius: 12,
      elevation: isDark ? 0 : 2,
    },
    floating: {
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    sheet: {
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.5 : 0.14,
      shadowRadius: 28,
      elevation: 20,
    },
  };
}

/** Deterministic accent hues for generated avatars. */
export const avatarHues = [
  '#3D6DF3',
  '#0FA968',
  '#D98400',
  '#E5484D',
  '#8B5CF6',
  '#0B84D8',
  '#D6409F',
  '#12A594',
] as const;

/** Opacity of the generated avatar background (appended to the hex color). */
export const avatarTintAlpha = '22';
