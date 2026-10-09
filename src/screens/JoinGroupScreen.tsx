import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText, Card } from 'react-native-paper';
import api from '../api/client';

export const JoinGroupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinedGroup, setJoinedGroup] = useState<any>(null);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Введите код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/groups/join', { code: code.trim().toUpperCase() });
      setJoinedGroup(response.data.group);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  if (joinedGroup) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.success}>
              ✅ Вы присоединились!
            </Text>
            <Text variant="bodyLarge" style={styles.groupName}>
              Группа: {joinedGroup.name}
            </Text>
            <Text variant="bodyMedium" style={styles.note}>
              Теперь ваши родители видят ваше местоположение.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Map')}>Перейти к карте</Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Присоединиться к группе
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Введите код, который вам дал родитель.
      </Text>

      <TextInput
        label="Код приглашения"
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase())}
        mode="outlined"
        autoCapitalize="characters"
        style={styles.input}
      />

      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}

      <Button
        mode="contained"
        onPress={handleJoin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Присоединиться
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 24, textAlign: 'center', color: '#666' },
  input: { marginBottom: 8 },
  button: { marginTop: 8 },
  card: { padding: 8 },
  success: { textAlign: 'center', marginBottom: 16 },
  groupName: { textAlign: 'center', marginBottom: 8 },
  note: { textAlign: 'center', color: '#666' },
});