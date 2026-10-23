import React from 'react';
import { View } from 'react-native';
import { layout, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

export interface AppBarProps {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  actions?: React.ReactNode;
}

/**
 * Large, left-aligned title used by tab screens instead of a native header.
 * One clear title per screen keeps the hierarchy obvious.
 */
export function AppBar({ title, subtitle, eyebrow, actions }: AppBarProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: layout.screenPadding,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? (
          <AppText variant="overline" tone="textTertiary">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title" numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actions ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}
