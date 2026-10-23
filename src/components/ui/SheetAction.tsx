import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface SheetActionProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
}

/** Large tappable row for action sheets (create / join / add member). */
export function SheetAction({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'default',
}: SheetActionProps) {
  const { colors } = useAppTheme();

  const tint =
    tone === 'danger'
      ? { background: colors.dangerSoft, foreground: colors.danger }
      : tone === 'primary'
        ? { background: colors.primarySoft, foreground: colors.primary }
        : { background: colors.surfaceMuted, foreground: colors.textSecondary };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: tint.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={tint.foreground} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="bodyStrong"
          style={tone === 'danger' ? { color: colors.danger } : undefined}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}
