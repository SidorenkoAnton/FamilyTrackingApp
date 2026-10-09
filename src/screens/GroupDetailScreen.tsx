import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  TextInput,
  Menu,
  Divider,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const GroupDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('child');
  const [menuVisible, setMenuVisible] = useState(false);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${groupId}`);
      setGroup(response.data);
      setMembers(response.data.members || []);
    } catch (e) {
      console.error('Ошибка загрузки группы:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [groupId]),
  );

  const handleAddMember = async () => {
    if (!email.trim()) return;

    try {
      await api.post(`/groups/${groupId}/members`, { email, role });
      setEmail('');
      loadGroup();
    } catch (e: any) {
      console.error('Ошибка добавления:', e.response?.data?.message);
    }
  };

  const handleDelete = () => {
  Alert.alert(
    'Удалить группу?',
    'Все участники и данные будут удалены. Это действие нельзя отменить.',
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/groups/${groupId}`);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Ошибка', e.response?.data?.message || 'Не удалось удалить');
          }
        },
      },
    ],
  );
};

  if (loading || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">{group.name}</Text>
      {group.description ? (
        <Text variant="bodyMedium">{group.description}</Text>
      ) : null}

      <Divider style={styles.divider} />

      <Text variant="titleMedium">Добавить участника</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
      />

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button mode="outlined" onPress={() => setMenuVisible(true)}>
            Роль: {role}
          </Button>
        }
      >
        <Menu.Item onPress={() => { setRole('child'); setMenuVisible(false); }} title="Ребёнок" />
        <Menu.Item onPress={() => { setRole('member'); setMenuVisible(false); }} title="Участник" />
        <Menu.Item onPress={() => { setRole('admin'); setMenuVisible(false); }} title="Админ" />
      </Menu>

      <Button mode="contained" onPress={handleAddMember} style={styles.addButton}>
        Добавить
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CreateInvite', { groupId })}
        style={{ marginBottom: 16 }}
      >
        Пригласить ребёнка
      </Button>

      <Divider style={styles.divider} />

      <Text variant="titleMedium">Участники ({members.length})</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.user.name || item.user.email}
              subtitle={`Роль: ${item.role}`}
            />
          </Card>
        )}
      />
      <Button
  mode="outlined"
  onPress={handleDelete}
  textColor="#f44336"
  style={{ marginTop: 24 }}
>
  Удалить группу
</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  divider: { marginVertical: 16 },
  input: { marginBottom: 12 },
  addButton: { marginBottom: 16 },
  card: { marginBottom: 8 },
});