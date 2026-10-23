import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { groupsApi } from '../api';
import {
  AppButton,
  AppInput,
  AppText,
  Avatar,
  BottomSheet,
  Card,
  ErrorState,
  InlineBanner,
  ListRow,
  RoleBadge,
  Screen,
  Section,
  Skeleton,
  useToast,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { radius, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import type { GroupsScreenProps } from '../navigation/types';
import type { GroupDetail, Role } from '../types';
import { getErrorMessage } from '../utils/errors';
import { plural } from '../utils/format';
import { validateEmail } from '../utils/validation';

export function GroupDetailScreen({ route, navigation }: GroupsScreenProps<'GroupDetail'>) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const toast = useToast();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('child');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const hasGroupRef = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);

      try {
        const data = await groupsApi.detail(groupId);
        setGroup(data);
        setError(null);
        hasGroupRef.current = true;
      } catch (loadError) {
        if (!hasGroupRef.current) {
          setError(getErrorMessage(loadError, 'Не удалось загрузить группу'));
        } else {
          toast.show(getErrorMessage(loadError, 'Не удалось обновить группу'), {
            tone: 'error',
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupId, toast],
  );

  useFocusEffect(
    useCallback(() => {
      void load(hasGroupRef.current ? 'silent' : 'initial');
    }, [load]),
  );

  useEffect(() => {
    if (group?.name) {
      navigation.setOptions({ title: group.name });
    } else if (groupName) {
      navigation.setOptions({ title: groupName });
    }
  }, [group?.name, groupName, navigation]);

  const myRole = useMemo<Role>(() => {
    const me = group?.members.find((member) => member.user.id === user?.id);
    return me?.role ?? 'member';
  }, [group?.members, user?.id]);

  const isAdmin = myRole === 'admin' || group?.ownerId === user?.id;
  const members = group?.members ?? [];

  const handleAddMember = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setAddError(emailError);
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      await groupsApi.addMember(groupId, email.trim(), role);
      setAddSheetVisible(false);
      setEmail('');
      setRole('child');
      toast.show('Участник добавлен в группу');
      await load('silent');
    } catch (addMemberError) {
      setAddError(getErrorMessage(addMemberError, 'Не удалось добавить участника'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить группу?',
      'Все участники потеряют доступ к общей карте. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsApi.remove(groupId);
              toast.show('Группа удалена');
              navigation.goBack();
            } catch (deleteError) {
              toast.show(getErrorMessage(deleteError, 'Не удалось удалить группу'), {
                tone: 'error',
              });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Screen edges={['bottom']} padded>
        <DetailSkeleton />
      </Screen>
    );
  }

  if (error || !group) {
    return (
      <Screen edges={['bottom']} padded>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            message={error ?? 'Группа не найдена'}
            onRetry={() => load('initial')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['bottom']}
      padded
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <View style={{ gap: spacing.xxl }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="headline" style={{ color: colors.onPrimarySoft }}>
                {group.name?.trim()?.[0]?.toUpperCase() ?? '?'}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="headline" numberOfLines={2}>
                {group.name}
              </AppText>
              <AppText variant="caption" tone="textSecondary">
                {members.length} {plural(members.length, 'участник', 'участника', 'участников')}
              </AppText>
            </View>
          </View>

          {group.description?.trim() ? (
            <AppText
              variant="body"
              tone="textSecondary"
              style={{ marginTop: spacing.md }}
            >
              {group.description}
            </AppText>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            <RoleBadge role={myRole} />
          </View>

          {isAdmin ? (
            <>
              <AppButton
                label="Пригласить в группу"
                icon="account-plus-outline"
                onPress={() =>
                  navigation.navigate('CreateInvite', { groupId, groupName: group.name })
                }
                style={{ marginTop: spacing.lg }}
              />
              <AppText
                variant="caption"
                tone="textTertiary"
                center
                style={{ marginTop: spacing.sm }}
              >
                Код действует 15 минут.
              </AppText>
            </>
          ) : null}
        </Card>

        <Section title="Участники">
          <Card padded={false}>
            {members.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <AppText variant="body" tone="textSecondary">
                  Участников пока нет.
                </AppText>
              </View>
            ) : (
              members.map((member, index) => {
                const isMe = member.user.id === user?.id;
                const isLast = index === members.length - 1;

                return (
                  <View
                    key={member.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Avatar
                      name={member.user.name}
                      email={member.user.email}
                      size={42}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {member.user.name?.trim() || member.user.email}
                        {isMe ? ' (вы)' : ''}
                      </AppText>
                      <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
                        {member.user.email}
                      </AppText>
                    </View>
                    <RoleBadge role={member.role} />
                  </View>
                );
              })
            )}
          </Card>
        </Section>

        {isAdmin ? (
          <Section title="Управление">
            <Card padded={false}>
              <ListRow
                icon="account-plus-outline"
                iconTone="primary"
                title="Добавить по email"
                subtitle="Если человек уже зарегистрирован"
                onPress={() => setAddSheetVisible(true)}
              />
              <ListRow
                icon="trash-can-outline"
                title="Удалить группу"
                subtitle="Действие нельзя отменить"
                destructive
                divider={false}
                onPress={handleDelete}
              />
            </Card>
          </Section>
        ) : (
          <InlineBanner
            tone="info"
            message="Управлять группой может только администратор."
          />
        )}

        <View style={{ height: spacing.sm }} />
      </View>

      <BottomSheet
        visible={addSheetVisible}
        onDismiss={() => setAddSheetVisible(false)}
        title="Добавить участника"
        description="Человек должен быть уже зарегистрирован в Family Tracker."
        footer={
          <AppButton
            label="Добавить"
            onPress={handleAddMember}
            loading={adding}
            disabled={!email.trim()}
          />
        }
      >
        <View style={{ gap: spacing.lg }}>
          <AppInput
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (addError) setAddError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            errorText={addError}
            editable={!adding}
          />

          <View style={{ gap: spacing.sm }}>
            <AppText variant="label" tone="textSecondary">
              Роль
            </AppText>
            <SegmentedButtons
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              buttons={[
                { value: 'child', label: 'Ребёнок' },
                { value: 'member', label: 'Взрослый' },
                { value: 'admin', label: 'Админ' },
              ]}
            />
            <AppText variant="caption" tone="textTertiary">
              Роль «Ребёнок» включает фоновую передачу геолокации на его устройстве.
            </AppText>
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

function DetailSkeleton() {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.md }}>
        <Skeleton width="45%" height={26} />
        <Skeleton width="80%" height={14} />
        <Skeleton width="65%" height={14} />
        <Skeleton width="100%" height={48} radius={14} />
      </View>
      <Skeleton width="100%" height={72} radius={18} />
      <Skeleton width="100%" height={72} radius={18} />
    </View>
  );
}
