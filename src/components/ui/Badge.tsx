import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import type { Role } from '../../types';
import { AppText } from './AppText';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

function useTone(tone: BadgeTone) {
  const { colors } = useAppTheme();

  switch (tone) {
    case 'primary':
      return { background: colors.primarySoft, foreground: colors.onPrimarySoft };
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

/** Compact status pill: role, last-seen state, sync state. */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { background, foreground } = useTone(tone);

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={12} color={foreground} /> : null}
      <AppText variant="caption" style={{ color: foreground, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const ROLE_CONFIG: Record<Role, { label: string; tone: BadgeTone; icon: IconName }> = {
  admin: { label: 'Админ', tone: 'warning', icon: 'shield-account-outline' },
  member: { label: 'Участник', tone: 'info', icon: 'account-outline' },
  child: { label: 'Ребёнок', tone: 'primary', icon: 'human-child' },
};

export function roleLabel(role: Role): string {
  return ROLE_CONFIG[role]?.label ?? role;
}

export function RoleBadge({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role] ?? {
    label: role,
    tone: 'neutral' as BadgeTone,
    icon: 'account-outline' as IconName,
  };

  return <Badge label={config.label} tone={config.tone} icon={config.icon} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
});
