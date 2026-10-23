import React from 'react';
import { Button } from 'react-native-paper';
import { radius } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

type PaperButtonProps = React.ComponentProps<typeof Button>;

export interface AppButtonProps
  extends Omit<PaperButtonProps, 'children' | 'mode' | 'uppercase'> {
  label: string;
  mode?: PaperButtonProps['mode'];
  /** Taller button for the single primary action of a screen. */
  large?: boolean;
}

/**
 * Single button style for the app: sentence-case label, 50pt height,
 * consistent radius. Paper handles the pressed/disabled/ripple states.
 */
export function AppButton({
  label,
  mode = 'contained',
  large = false,
  icon,
  loading,
  disabled,
  style,
  contentStyle,
  labelStyle,
  textColor,
  buttonColor,
  ...rest
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const isContained = mode === 'contained' || mode === 'elevated';

  return (
    <Button
      {...rest}
      mode={mode}
      icon={icon}
      loading={loading}
      disabled={disabled || loading}
      uppercase={false}
      accessibilityLabel={rest.accessibilityLabel ?? label}
      textColor={textColor ?? (isContained ? colors.onPrimary : colors.onPrimarySoft)}
      buttonColor={
        buttonColor ?? (isContained ? colors.primary : mode === 'outlined' ? colors.surface : undefined)
      }
      contentStyle={[{ height: large ? 54 : 50, paddingHorizontal: 8 }, contentStyle]}
      labelStyle={[
        { fontSize: large ? 16.5 : 16, fontWeight: '600', letterSpacing: 0.1 },
        labelStyle,
      ]}
      style={[
        { borderRadius: radius.md },
        mode === 'outlined' && { borderColor: colors.borderStrong, borderWidth: 1 },
        mode === 'text' && { paddingHorizontal: 4 },
        style,
      ]}
    >
      {label}
    </Button>
  );
}
