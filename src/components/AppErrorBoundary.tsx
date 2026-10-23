import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import { BrandMark } from './BrandMark';
import { AppButton, AppText } from './ui';

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xxl,
          gap: spacing.md,
        }}
      >
        <BrandMark size={64} />
        <AppText variant="headline" center>
          Что-то пошло не так
        </AppText>
        <AppText variant="body" tone="textSecondary" center style={{ maxWidth: 320 }}>
          Приложение столкнулось с неожиданной ошибкой. Попробуйте вернуться назад —
          данные не потеряны.
        </AppText>
        {__DEV__ ? (
          <AppText
            variant="caption"
            tone="textTertiary"
            center
            style={{ maxWidth: 340 }}
            numberOfLines={4}
          >
            {error.message}
          </AppText>
        ) : null}
        <AppButton label="Попробовать снова" onPress={onReset} style={{ marginTop: spacing.md }} />
      </View>
    </SafeAreaView>
  );
}

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: instead of a white screen, the user gets an
 * explanation and a way back into the app.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
