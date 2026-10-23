import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { AuthShell } from '../components/AuthShell';
import { AppButton, AppInput, AppText, InlineBanner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design/tokens';
import type { RootScreenProps } from '../navigation/types';
import { getErrorMessage } from '../utils/errors';
import { validateEmail, validatePassword } from '../utils/validation';

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { login } = useAuth();
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      setErrors({ form: getErrorMessage(error, 'Не удалось войти') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы видеть, где сейчас ваша семья."
      footer={
        <View style={{ gap: spacing.md, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText variant="body" tone="textSecondary">
              Впервые здесь?
            </AppText>
            <AppButton
              label="Создать аккаунт"
              mode="text"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
          <AppText variant="caption" tone="textTertiary" center>
            Геолокация используется только участниками вашей семьи.
          </AppText>
        </View>
      }
    >
      <AppInput
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (errors.email || errors.form) setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        autoFocus
        editable={!submitting}
        errorText={errors.email}
        left={<TextInput.Icon icon="email-outline" />}
        onSubmitEditing={() => passwordRef.current?.focus()}
        accessibilityLabel="Email"
      />

      <AppInput
        ref={passwordRef}
        label="Пароль"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (errors.password || errors.form) setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        editable={!submitting}
        errorText={errors.password}
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword((value) => !value)}
            forceTextInputFocus={false}
          />
        }
        onSubmitEditing={handleSubmit}
      />

      {errors.form ? <InlineBanner message={errors.form} tone="danger" /> : null}

      <AppButton
        label="Войти"
        large
        onPress={handleSubmit}
        loading={submitting}
        style={{ marginTop: spacing.xs }}
      />
    </AuthShell>
  );
}
