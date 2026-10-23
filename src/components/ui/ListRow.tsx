import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type RowTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Short right-aligned value, e.g. "Активно" or "1.0.0". */
  value?: string;
  icon?: IconName;
  iconTone?: RowTone;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  /** Hairline separator; set false for the last row. */
  divider?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
}

function toneColors(
  colors: ReturnType<typeof useAppTheme>['colors'],
  tone: RowTone,
): { background: string; foreground: string } {
  switch (tone) {
    case 'primary':
      return { background: colors.primarySoft, foreground: colors.primary };
    case 'success':
      return { background: colors.successSoft, foreground: colors.success };
    case 'warning':
      return { background: colors.warningSoft, foreground: colors.warning };
    case 'danger':
      return { background: colors.dangerSoft, foreground: colors.danger };
    case 'info':
      return { background: colors.infoSoft, foreground: colors.info };
    default:
      return { background: colors.surfaceMuted, foreground: colors.textSecondary };
  }
}

/** Settings-style row with optional leading icon and trailing value/chevron. */
export function ListRow({
  title,
  subtitle,
  value,
  icon,
  iconTone = 'neutral',
  onPress,
  right,
  showChevron = Boolean(onPress),
  divider = true,
  destructive = false,
  accessibilityHint,
}: ListRowProps) {
  const { colors } = useAppTheme();
  const tint = toneColors(colors, destructive ? 'danger' : iconTone);

  const content = (
    <>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.pill,
            backgroundColor: tint.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon} size={19} color={tint.foreground} />
        </View>
      ) : null}

      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="bodyStrong"
          numberOfLines={1}
          style={destructive ? { color: colors.danger } : undefined}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="textSecondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {value ? (
        <AppText variant="caption" tone="textTertiary" numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {right}
      {showChevron ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    {
      borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: colors.border,
    },
  ];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        rowStyle,
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    minHeight: 56,
  },
});
