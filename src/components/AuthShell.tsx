import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import { AppText } from './ui/AppText';
import { BrandMark } from './BrandMark';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared layout for Login and Register: brand, one headline, the form, and
 * nothing else. The decorative circles add depth without extra dependencies.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={{
            position: 'absolute',
            top: -90,
            right: -70,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: colors.primarySoft,
            opacity: 0.8,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 120,
            left: -100,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: colors.infoSoft,
            opacity: 0.6,
          }}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xxl,
            paddingTop: spacing.xxxl,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxxl }}>
            <BrandMark size={68} />
            <AppText variant="title" center>
              {title}
            </AppText>
            <AppText
              variant="body"
              tone="textSecondary"
              center
              style={{ maxWidth: 300 }}
            >
              {subtitle}
            </AppText>
          </View>

          <View style={{ gap: spacing.md }}>{children}</View>

          {footer ? <View style={{ marginTop: spacing.xl }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
