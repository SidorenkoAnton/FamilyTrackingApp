import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { groupsApi } from '../api';
import { GroupCard } from '../components/GroupCard';
import {
  AppBar,
  AppText,
  BottomSheet,
  EmptyState,
  ErrorState,
  IconAction,
  InlineBanner,
  Screen,
  SheetAction,
  Skeleton,
} from '../components/ui';
import { spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import type { GroupsScreenProps } from '../navigation/types';
import type { GroupMembership } from '../types';
import { getErrorMessage } from '../utils/errors';
import { plural } from '../utils/format';

export function GroupsListScreen({ navigation }: GroupsScreenProps<'GroupsList'>) {
  const { colors } = useAppTheme();
  const hasGroupsRef = useRef(false);

  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleError, setStaleError] = useState<string | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    try {
      const data = await groupsApi.list();
      setGroups(data);
      setError(null);
      setStaleError(null);
    } catch (loadError) {
      const message = getErrorMessage(loadError, 'Не удалось загрузить группы');
      if (hasGroupsRef.current) {
        setStaleError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(hasGroupsRef.current ? 'silent' : 'initial');
    }, [load]),
  );

  React.useEffect(() => {
    hasGroupsRef.current = groups.length > 0;
  }, [groups]);

  const openCreateGroup = () => {
    setAddSheetVisible(false);
    navigation.navigate('CreateGroup');
  };

  const openJoinGroup = () => {
    setAddSheetVisible(false);
    navigation.navigate('JoinGroup');
  };

  const subtitle =
    groups.length > 0
      ? `${groups.length} ${plural(groups.length, 'группа', 'группы', 'групп')}`
      : 'Семейные группы';

  return (
    <Screen edges={['top']}>
      <AppBar
        title="Группы"
        subtitle={subtitle}
        actions={
          <IconAction
            icon="plus"
            accessibilityLabel="Добавить группу"
            variant="primary"
            onPress={() => setAddSheetVisible(true)}
          />
        }
      />

      <View style={{ flex: 1 }}>
        {loading ? (
          <GroupListSkeleton />
        ) : error && groups.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ErrorState message={error} onRetry={() => load('initial')} />
          </View>
        ) : groups.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon="account-group-outline"
              title="Пока нет групп"
              description="Создайте семейную группу или присоединитесь к уже существующей по коду приглашения."
              actionLabel="Создать группу"
              onAction={openCreateGroup}
              secondaryLabel="Войти по коду"
              onSecondary={openJoinGroup}
            />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.xxl,
              gap: spacing.sm + 2,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load('refresh')}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            }
            ListHeaderComponent={
              staleError ? (
                <InlineBanner
                  message="Не удалось обновить список. Показаны прошлые данные."
                  tone="warning"
                  actionLabel="Повторить"
                  onAction={() => load('silent')}
                />
              ) : null
            }
            ListFooterComponent={
              <AppText
                variant="caption"
                tone="textTertiary"
                center
                style={{ marginTop: spacing.md }}
              >
                Нажмите на группу, чтобы увидеть участников и пригласить новых.
              </AppText>
            }
            renderItem={({ item }) => (
              <GroupCard
                membership={item}
                onPress={() =>
                  navigation.navigate('GroupDetail', {
                    groupId: item.group.id,
                    groupName: item.group.name,
                    role: item.role,
                  })
                }
              />
            )}
          />
        )}
      </View>

      <BottomSheet
        visible={addSheetVisible}
        onDismiss={() => setAddSheetVisible(false)}
        title="Добавить группу"
        description="Создайте новую семейную группу или войдите в существующую по коду."
      >
        <View style={{ paddingBottom: spacing.sm }}>
          <SheetAction
            icon="account-group-outline"
            title="Создать группу"
            subtitle="Вы станете её администратором"
            tone="primary"
            onPress={openCreateGroup}
          />
          <SheetAction
            icon="ticket-confirmation-outline"
            title="Войти по коду"
            subtitle="Код приглашения даёт родитель"
            onPress={openJoinGroup}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function GroupListSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm + 2 }}>
      {[0, 1, 2].map((key) => (
        <View
          key={key}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        >
          <Skeleton width={48} height={48} radius={14} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="80%" height={12} />
          </View>
          <Skeleton width={64} height={24} radius={12} />
        </View>
      ))}
    </View>
  );
}
