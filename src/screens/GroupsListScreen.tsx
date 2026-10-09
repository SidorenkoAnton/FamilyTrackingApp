import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';

interface GroupData {
  id: string;
  role: string;
  group: {
    id: string;
    name: string;
    description?: string;
  };
}

export const GroupsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (e) {
      console.error('Ошибка загрузки групп:', e);
    } finally {
      setLoading(false);
    }
  };

  // Обновляем список каждый раз, когда экран появляется
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CreateGroup')}
        style={styles.createButton}
      >
        Создать группу
      </Button>

      {groups.length === 0 ? (
        <View style={styles.center}>
          <Text>У вас пока нет групп</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() =>
                navigation.navigate('GroupDetail', { groupId: item.group.id })
              }
            >
              <Card.Title
                title={item.group.name}
                subtitle={`Ваша роль: ${item.role}`}
              />
              {item.group.description ? (
                <Card.Content>
                  <Text>{item.group.description}</Text>
                </Card.Content>
              ) : null}
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  createButton: { marginBottom: 16 },
  list: { paddingBottom: 20 },
  card: { marginBottom: 12 },
});