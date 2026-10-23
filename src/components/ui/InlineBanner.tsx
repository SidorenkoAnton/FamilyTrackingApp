import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export type BannerTone = 'danger' | 'warning' | 'info' | 'success';

export interface InlineBannerProps {
  message: string;
  tone?: BannerTone;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Non-blocking inline message. Replaces one-off red banners and alert popups
 * for recoverable states (offline, permission denied, stale data).
 */
export function InlineBanner({
  message,
  tone = 'danger',
  icon,
  actionLabel,
  onAction,
}: InlineBannerProps) {
  const { colors } = useAppTheme();

  const palette =
    tone === 'danger'
      ? { background: colors.dangerSoft, foreground: colors.danger }
      : tone === 'warning'
        ? { background: colors.warningSoft, foreground: colors.warning }
        : tone === 'success'
          ? { background: colors.successSoft, foreground: colors.success }
          : { background: colors.infoSoft, foreground: colors.info };

  const defaultIcon: IconName =
    tone === 'danger'
      ? 'alert-circle-outline'
      : tone === 'warning'
        ? 'alert-outline'
        : tone === 'success'
          ? 'check-circle-outline'
          : 'information-outline';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: palette.background,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
      }}
      accessibilityRole="alert"
    >
      <MaterialCommunityIcons name={icon ?? defaultIcon} size={18} color={palette.foreground} />
      <AppText variant="caption" style={{ color: palette.foreground, flex: 1 }}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
        >
          <AppText variant="caption" style={{ color: palette.foreground, fontWeight: '700' }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
