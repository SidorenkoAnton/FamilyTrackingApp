import React from 'react';
import { View } from 'react-native';
import { TextInput, type TextInputProps } from 'react-native-paper';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

export interface AppInputProps extends Omit<TextInputProps, 'mode'> {
  /** Inline validation message rendered under the field. */
  errorText?: string | null;
}

/**
 * One text field style for the whole app: outlined, 14pt radius, surface fill,
 * readable label and an inline error message instead of an alert.
 */
export const AppInput = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  AppInputProps
>(function AppInput({ errorText, style, outlineStyle, contentStyle, ...rest }, ref) {
  const { colors } = useAppTheme();
  const hasError = Boolean(errorText);

  return (
    <View style={{ gap: spacing.xs }}>
      <TextInput
        {...rest}
        ref={ref as React.ComponentProps<typeof TextInput>['ref']}
        mode="outlined"
        textColor={colors.text}
        placeholderTextColor={colors.textTertiary}
        outlineColor={hasError ? colors.danger : colors.border}
        activeOutlineColor={hasError ? colors.danger : colors.primary}
        outlineStyle={[{ borderRadius: radius.md, borderWidth: 1 }, outlineStyle]}
        contentStyle={[{ fontSize: 15 }, contentStyle]}
        style={[{ backgroundColor: colors.surface, fontSize: 15 }, style]}
        error={hasError}
        accessibilityLabel={
          rest.accessibilityLabel ??
          (typeof rest.label === 'string' ? rest.label : undefined)
        }
      />
      {hasError ? (
        <AppText variant="caption" tone="danger" style={{ paddingHorizontal: spacing.xs }}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
});
