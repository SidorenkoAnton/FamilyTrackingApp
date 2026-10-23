import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type IconActionVariant = 'solid' | 'soft' | 'primary' | 'ghost';
export type IconActionTone = 'default' | 'primary' | 'danger';

export interface IconActionProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: IconActionVariant;
  tone?: IconActionTone;
  /** Icon glyph size; the touch target always stays 44x44. */
  size?: number;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Accessible 44x44 icon button. Used for header actions, map controls and
 * list affordances so the tap target never shrinks below the platform minimum.
 */
export function IconAction({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'solid',
  tone = 'default',
  size = 22,
  loading = false,
  disabled = false,
  style,
}: IconActionProps) {
  const { colors } = useAppTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'soft'
        ? colors.surfaceMuted
        : variant === 'ghost'
          ? 'transparent'
          : colors.surface;

  const iconColor =
    variant === 'primary'
      ? colors.onPrimary
      : tone === 'danger'
        ? colors.danger
        : tone === 'primary'
          ? colors.primary
          : colors.textSecondary;

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderWidth: variant === 'solid' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.75 : 1,
        },
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size={size - 4} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={icon} size={size} color={iconColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
