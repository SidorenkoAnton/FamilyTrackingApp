import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type AppColors, type TypographyVariant } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

type Tone = Extract<
  keyof AppColors,
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'textInverse'
  | 'primary'
  | 'onPrimary'
  | 'onPrimarySoft'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
>;

export interface AppTextProps extends TextProps {
  /** Typography scale from the design system. */
  variant?: TypographyVariant;
  /** Semantic color from the app palette. */
  tone?: Tone;
  center?: boolean;
}

/**
 * The only text component used by screens. Keeps type scale and contrast
 * consistent and makes dark mode automatic.
 */
export function AppText({
  variant = 'body',
  tone = 'text',
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: colors[tone] },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
