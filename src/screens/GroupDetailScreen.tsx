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
import { isSameUser, normalizeRole } from '../utils/roles';
import { validateEmail } from '../utils/validation';

export function GroupDetailScreen({ route, navigation }: GroupsScreenProps<'GroupDetail'>) {
  const { groupId, groupName, role: initialRole } = route.params;
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const toast = useToast();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  // Role from GET /groups is authoritative; the detail payload may omit the
  // current user or use a different role name ("owner").
  const [membershipRole, setMembershipRole] = useState<string | null>(
    initialRole ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const hasGroupRef = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);

      try {
        const [data, memberships] = await Promise.all([
          groupsApi.detail(groupId),
          groupsApi.list().catch(() => null),
        ]);

        setGroup(data);
        setError(null);
        hasGroupRef.current = true;

        const mine = memberships?.find(
          (item) => String(item.group?.id) === String(groupId),
        );
        if (mine?.role) setMembershipRole(mine.role);
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

  const rawRole = useMemo<string | null>(() => {
    if (membershipRole) return membershipRole;

    const me = group?.members?.find((member) => isSameUser(member.user, user));
    return me?.role ?? null;
  }, [membershipRole, group?.members, user]);

  const isOwner = Boolean(
    group?.ownerId != null &&
      user?.id != null &&
      String(group.ownerId) === String(user.id),
  );
  const resolvedRole = normalizeRole(rawRole);
  const isAdmin = resolvedRole === 'admin' || isOwner;
  // If the role could not be resolved at all, fail open: the backend still
  // enforces permissions, but the user must never lose the invite button.
  const canManage = isAdmin || resolvedRole === null;
  const badgeRole = isOwner ? 'owner' : rawRole;
  const members = group?.members ?? [];

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

          {badgeRole ? (
            <View style={{ marginTop: spacing.md }}>
              <RoleBadge role={badgeRole} />
            </View>
          ) : null}

          {canManage ? (
            <>
              <AppButton
                label="Пригласить ребёнка"
                icon="account-child-outline"
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
                const isMe = isSameUser(member.user, user);
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

        {canManage ? (
          <Section title="Управление">
            <Card padded={false}>
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
            message="Добавлять участников по email и удалять группу может только администратор."
          />
        )}

        <View style={{ height: spacing.sm }} />
      </View>
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
