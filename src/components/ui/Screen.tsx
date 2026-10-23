import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { layout } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

export interface ScreenProps {
  children: React.ReactNode;
  /** Use a ScrollView for form/content screens. */
  scroll?: boolean;
  /** Apply the standard 20pt horizontal + vertical padding. */
  padded?: boolean;
  /** Safe-area edges to inset. Defaults to the top edge only. */
  edges?: readonly Edge[];
  /** Vertically center short content (empty and error states). */
  centerContent?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Keep the focused input / sticky footer above the keyboard. */
  avoidKeyboard?: boolean;
  /** Sticky action area rendered below the scrollable content. */
  footer?: React.ReactNode;
}

export function Screen({
  children,
  scroll = false,
  padded = false,
  edges = ['top'],
  centerContent = false,
  style,
  contentContainerStyle,
  refreshControl,
  avoidKeyboard = false,
  footer,
}: ScreenProps) {
  const { colors } = useAppTheme();
  const padding = padded ? layout.screenPadding : 0;

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        centerContent && { flexGrow: 1, justifyContent: 'center' },
        { padding },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding }, style]}>{children}</View>
  );

  const footerNode = footer ? (
    <View
      style={{
        paddingHorizontal: layout.screenPadding,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      {footer}
    </View>
  ) : null;

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
          {footerNode}
        </KeyboardAvoidingView>
      ) : (
        <>
          {content}
          {footerNode}
        </>
      )}
    </SafeAreaView>
  );
}
