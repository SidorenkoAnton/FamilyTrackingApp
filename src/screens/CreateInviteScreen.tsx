import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import api from '../api/client';

export const CreateInviteScreen: React.FC<{ route: any }> = ({ route }) => {
  const { groupId } = route.params;
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/groups/${groupId}/invites`, {
        role: 'child',
        expiresInMinutes: 15,
      });
      setInvite(response.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка создания кода');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (invite?.code) {
      await Clipboard.setStringAsync(invite.code);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Пригласить ребёнка
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Создайте код и передайте его ребёнку. Он введёт его в своём приложении,
        чтобы присоединиться к группе.
      </Text>

      {!invite ? (
        <Button
          mode="contained"
          onPress={createInvite}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Создать код
        </Button>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.label}>
              Код приглашения:
            </Text>
            <Text variant="displaySmall" style={styles.code}>
              {invite.code}
            </Text>
            <Text variant="bodySmall" style={styles.expires}>
              Действует до: {new Date(invite.expiresAt).toLocaleTimeString()}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={copyCode}>Скопировать</Button>
            <Button onPress={() => setInvite(null)}>Создать новый</Button>
          </Card.Actions>
        </Card>
      )}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 24, color: '#666' },
  button: { marginTop: 8 },
  card: { marginTop: 16 },
  label: { marginBottom: 8 },
  code: {
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 16,
  },
  expires: { textAlign: 'center', color: '#999' },
  error: { color: 'red', marginTop: 16, textAlign: 'center' },
});