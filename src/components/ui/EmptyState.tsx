import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
}

/** Friendly empty state with a single primary next step. */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: compact ? spacing.xl : spacing.xxxl,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          width: compact ? 56 : 76,
          height: compact ? 56 : 76,
          borderRadius: radius.pill,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={compact ? 26 : 34}
          color={colors.primary}
        />
      </View>

      <AppText variant={compact ? 'subhead' : 'headline'} center>
        {title}
      </AppText>

      {description ? (
        <AppText
          variant="body"
          tone="textSecondary"
          center
          style={{ maxWidth: 300, marginBottom: spacing.sm }}
        >
          {description}
        </AppText>
      ) : null}

      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          style={{ alignSelf: 'stretch', maxWidth: 320, width: '100%' }}
        />
      ) : null}

      {secondaryLabel && onSecondary ? (
        <AppButton label={secondaryLabel} mode="text" onPress={onSecondary} />
      ) : null}
    </View>
  );
}
