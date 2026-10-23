import React from 'react';
import { View } from 'react-native';
import { radius, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import type { GroupMembership } from '../types';
import { AppText, Card, RoleBadge } from './ui';

export interface GroupCardProps {
  membership: GroupMembership;
  onPress: () => void;
}

/** Group row: colored initial, name, description and the current role. */
export function GroupCard({ membership, onPress }: GroupCardProps) {
  const { colors } = useAppTheme();
  const initial = membership.group.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <Card onPress={onPress} accessibilityLabel={`Группа ${membership.group.name}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="headline" style={{ color: colors.onPrimarySoft }}>
            {initial}
          </AppText>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="subhead" numberOfLines={1}>
            {membership.group.name}
          </AppText>
          <AppText
            variant="caption"
            tone={membership.group.description ? 'textSecondary' : 'textTertiary'}
            numberOfLines={1}
          >
            {membership.group.description?.trim() || 'Без описания'}
          </AppText>
        </View>

        <RoleBadge role={membership.role} />
      </View>
    </Card>
  );
}
