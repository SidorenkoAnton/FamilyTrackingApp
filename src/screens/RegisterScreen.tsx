import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { AuthShell } from '../components/AuthShell';
import { AppButton, AppInput, AppText, InlineBanner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design/tokens';
import type { RootScreenProps } from '../navigation/types';
import { getErrorMessage } from '../utils/errors';
import { validateEmail, validateName, validatePassword } from '../utils/validation';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

export function RegisterScreen({ navigation }: RootScreenProps<'Register'>) {
  const { register } = useAuth();
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError || emailError || passwordError) {
      setErrors({
        name: nameError ?? undefined,
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (error) {
      setErrors({ form: getErrorMessage(error, 'Не удалось создать аккаунт') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Пара минут — и вы сможете пригласить семью в одну группу."
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <AppText variant="body" tone="textSecondary">
            Уже есть аккаунт?
          </AppText>
          <AppButton label="Войти" mode="text" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <AppInput
        label="Имя"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (errors.name || errors.form) setErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
        }}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        autoFocus
        editable={!submitting}
        errorText={errors.name}
        left={<TextInput.Icon icon="account-outline" />}
        onSubmitEditing={() => emailRef.current?.focus()}
        accessibilityLabel="Имя"
      />

      <AppInput
        ref={emailRef}
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
        editable={!submitting}
        errorText={errors.email}
        left={<TextInput.Icon icon="email-outline" />}
        onSubmitEditing={() => passwordRef.current?.focus()}
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
        autoComplete="new-password"
        textContentType="newPassword"
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

      {!errors.password ? (
        <AppText variant="caption" tone="textTertiary" style={{ paddingHorizontal: spacing.xs }}>
          Минимум 6 символов.
        </AppText>
      ) : null}

      {errors.form ? <InlineBanner message={errors.form} tone="danger" /> : null}

      <AppButton
        label="Создать аккаунт"
        large
        onPress={handleSubmit}
        loading={submitting}
        style={{ marginTop: spacing.xs }}
      />
    </AuthShell>
  );
}
