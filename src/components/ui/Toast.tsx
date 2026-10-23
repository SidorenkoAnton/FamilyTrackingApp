import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import { AppText } from './AppText';

export type ToastTone = 'default' | 'error';

interface ToastOptions {
  tone?: ToastTone;
}

interface ToastState {
  message: string;
  tone: ToastTone;
  key: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 2600;

/**
 * Minimal toast used for "copied", "saved", "no connection" feedback.
 * It replaces the previous mix of Alert.alert calls, which blocked the UI.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showIdRef = useRef(0);

  const hide = useCallback(
    (id: number) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        // A newer toast appeared while this one was fading out.
        if (finished && showIdRef.current === id) setState(null);
      });
    },
    [opacity, translateY],
  );

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);

      const id = showIdRef.current + 1;
      showIdRef.current = id;

      setState({ message, tone: options?.tone ?? 'default', key: Date.now() });
      opacity.setValue(0);
      translateY.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      timer.current = setTimeout(() => hide(id), TOAST_DURATION_MS);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = React.useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {state ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: spacing.xl,
            right: spacing.xl,
            bottom: insets.bottom + 76,
            alignItems: 'center',
            opacity,
            transform: [{ translateY }],
          }}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surfaceInverse,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
              maxWidth: 520,
              shadowColor: colors.shadow,
              ...shadows.floating,
            }}
          >
            <MaterialCommunityIcons
              name={state.tone === 'error' ? 'alert-circle-outline' : 'check-circle-outline'}
              size={20}
              color={state.tone === 'error' ? colors.danger : colors.success}
            />
            <AppText
              variant="bodyStrong"
              style={{ color: colors.textInverse, flexShrink: 1 }}
              numberOfLines={3}
            >
              {state.message}
            </AppText>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return value;
}
