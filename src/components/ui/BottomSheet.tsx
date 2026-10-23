import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Sticky action area below the scrollable content. */
  footer?: React.ReactNode;
}

/**
 * Lightweight bottom sheet: slides up, dims the screen, closes on backdrop
 * tap or hardware back. Used for secondary flows so screens don't accumulate
 * inline forms and menus.
 */
export function BottomSheet({
  visible,
  onDismiss,
  title,
  description,
  children,
  footer,
}: BottomSheetProps) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;

    if (visible) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Re-opening during the close animation must not unmount the sheet.
      if (finished && !visibleRef.current) setMounted(false);
    });
    // `progress` is a ref-like Animated.Value and is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted]);

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [520, 0],
  });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.scrim, opacity: progress },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
              shadowColor: colors.shadow,
              transform: [{ translateY }],
              maxHeight: '90%',
            },
            shadows.sheet,
          ]}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: radius.pill,
              backgroundColor: colors.borderStrong,
              marginTop: spacing.sm,
            }}
          />

          {title ? (
            <View
              style={{
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.lg,
                paddingBottom: description ? spacing.xs : spacing.md,
                gap: spacing.xs,
              }}
            >
              <AppText variant="headline" accessibilityRole="header">
                {title}
              </AppText>
              {description ? (
                <AppText variant="caption" tone="textSecondary">
                  {description}
                </AppText>
              ) : null}
            </View>
          ) : (
            <View style={{ height: spacing.md }} />
          )}

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? (
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
  },
});
