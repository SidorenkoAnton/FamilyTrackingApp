import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View } from 'react-native';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** Compact version for inline use inside a card. */
  compact?: boolean;
}

/** Recoverable error with an explicit retry action — never a dead end. */
export function ErrorState({
  title = 'Не удалось загрузить данные',
  message,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: compact ? spacing.lg : spacing.xxxl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          width: compact ? 48 : 64,
          height: compact ? 48 : 64,
          borderRadius: radius.pill,
          backgroundColor: colors.dangerSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="cloud-alert-outline"
          size={compact ? 24 : 30}
          color={colors.danger}
        />
      </View>
      <AppText variant={compact ? 'bodyStrong' : 'subhead'} center>
        {title}
      </AppText>
      <AppText
        variant="body"
        tone="textSecondary"
        center
        style={{ maxWidth: 300, marginBottom: spacing.xs }}
      >
        {message}
      </AppText>
      {onRetry ? (
        <AppButton
          label="Повторить"
          mode="outlined"
          icon="refresh"
          onPress={onRetry}
          style={{ minWidth: 160 }}
        />
      ) : null}
    </View>
  );
}
