import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { layout, radius } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Adds the standard 16pt inner padding. Disable for custom list layouts. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * The single surface used across the app: white/dark card, 18pt radius,
 * hairline border and a very soft shadow. Pressable cards get a subtle
 * pressed state instead of a heavy ripple.
 */
export function Card({
  children,
  onPress,
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const { colors } = useAppTheme();

  const baseStyle = [
    styles.base,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    padded && { padding: layout.cardPadding },
    style,
  ];

  if (!onPress) {
    return <View style={baseStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        baseStyle,
        pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
