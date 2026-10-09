import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, TextInput, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Заполни все поля');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      const message = e.response?.data?.message || 'Ошибка входа';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 30 }}>
      <Text variant="displaySmall" style={{ textAlign: 'center', marginBottom: 8, color: theme.colors.primary }}>
        Family Tracker
      </Text>
      <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 40 }}>
        Войдите в аккаунт
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: 15 }}
      />

      <TextInput
        label="Пароль"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={{ marginBottom: 15 }}
      />

      {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 10 }}
      >
        Войти
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={{ marginTop: 20 }}
      >
        Нет аккаунта? Зарегистрироваться
      </Button>
    </View>
  );
};