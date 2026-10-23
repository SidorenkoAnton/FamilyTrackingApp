import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../design/tokens';
import { AppText } from './AppText';

export interface SectionProps {
  /** Optional uppercase section label. */
  title?: string;
  /** Optional action rendered on the right of the label row. */
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Groups related content under one label with consistent vertical rhythm. */
export function Section({ title, action, children, style }: SectionProps) {
  return (
    <View style={[{ gap: spacing.sm }, style]}>
      {title || action ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 20,
            paddingHorizontal: 2,
          }}
        >
          {title ? (
            <AppText variant="overline" tone="textTertiary">
              {title.toUpperCase()}
            </AppText>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
