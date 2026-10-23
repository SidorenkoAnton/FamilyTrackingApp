import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { groupsApi } from '../api';
import {
  AppButton,
  AppInput,
  AppText,
  Avatar,
  Card,
  InlineBanner,
  ListRow,
  Screen,
  useToast,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import type { GroupsScreenProps } from '../navigation/types';
import type { GroupSummary } from '../types';
import { getErrorMessage } from '../utils/errors';
import { openAppSettings } from '../utils/linking';
import { normalizeInviteCode } from '../utils/validation';

export function JoinGroupScreen({ navigation, route }: GroupsScreenProps<'JoinGroup'>) {
  const { syncTracking, setupTracking, trackingActive, isChildRole } = useAuth();
  const { colors } = useAppTheme();
  const toast = useToast();

  const [code, setCode] = useState(() => normalizeInviteCode(route.params?.code ?? ''));
  const [joinedGroup, setJoinedGroup] = useState<GroupSummary | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoJoinRef = useRef(false);

  const handleJoin = useCallback(async () => {
    const normalized = normalizeInviteCode(code);
    if (normalized.length < 4) {
      setError('Код слишком короткий');
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const result = await groupsApi.join(normalized);
      setJoinedGroup(result.group);
      toast.show(`Вы в группе «${result.group.name}»`);
      void syncTracking();
    } catch (joinError) {
      setError(getErrorMessage(joinError, 'Не удалось войти в группу'));
    } finally {
      setJoining(false);
    }
  }, [code, syncTracking, toast]);

  // Deep-link style entry: a code passed in the route is submitted immediately.
  useEffect(() => {
    if (!route.params?.code || autoJoinRef.current) return;
    autoJoinRef.current = true;
    void handleJoin();
  }, [handleJoin, route.params?.code]);

  const handlePaste = async () => {
    try {
      const clipboard = await Clipboard.getStringAsync();
      if (clipboard) {
        setCode(normalizeInviteCode(clipboard));
        setError(null);
      }
    } catch {
      toast.show('Не удалось прочитать буфер обмена', { tone: 'error' });
    }
  };

  const handleEnableTracking = async () => {
    const active = await setupTracking();
    toast.show(
      active
        ? 'Отслеживание включено'
        : 'Разрешите доступ к геолокации «В любое время» в настройках',
      { tone: active ? 'default' : 'error' },
    );
  };

  if (joinedGroup) {
    const needsPermission = Platform.OS === 'android' && isChildRole && !trackingActive;

    return (
      <Screen scroll edges={['bottom']} padded>
        <View style={{ gap: spacing.lg, alignItems: 'center' }}>
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: colors.successSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: spacing.xl,
            }}
          >
            <Avatar
              name={joinedGroup.name}
              size={64}
              status="online"
            />
          </View>

          <AppText variant="title" center>
            Вы в группе
          </AppText>
          <AppText variant="headline" center style={{ color: colors.onPrimarySoft }}>
            {joinedGroup.name}
          </AppText>
          <AppText variant="body" tone="textSecondary" center style={{ maxWidth: 320 }}>
            Теперь вы можете видеть близких на карте — и они видят вас.
          </AppText>

          {needsPermission ? (
            <Card padded={false} style={{ width: '100%', marginTop: spacing.md }}>
              <ListRow
                icon="map-marker-radius-outline"
                iconTone="primary"
                title="Включить отслеживание"
                subtitle="Разрешите геолокацию «В любое время», чтобы родители видели вас, даже когда приложение свёрнуто"
                divider={false}
                onPress={handleEnableTracking}
              />
              <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
                <AppButton
                  label="Открыть настройки"
                  mode="text"
                  onPress={openAppSettings}
                />
              </View>
            </Card>
          ) : null}

          <AppButton
            label="Готово"
            large
            onPress={() => navigation.goBack()}
            style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['bottom']} padded avoidKeyboard>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="title" style={{ color: colors.primary }}>
              #
            </AppText>
          </View>
          <AppText variant="headline" center>
            Введите код приглашения
          </AppText>
          <AppText variant="body" tone="textSecondary" center style={{ maxWidth: 300 }}>
            Родитель пришлёт код из 6 символов. Он действует 15 минут.
          </AppText>
        </View>

        <AppInput
          label="Код"
          value={code}
          onChangeText={(value) => {
            setCode(normalizeInviteCode(value));
            if (error) setError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          editable={!joining}
          errorText={error}
          contentStyle={{
            textAlign: 'center',
            letterSpacing: 6,
            fontSize: 20,
            fontWeight: '600',
          }}
          onSubmitEditing={handleJoin}
        />

        <AppButton
          label="Вставить из буфера"
          mode="text"
          icon="content-paste"
          onPress={handlePaste}
        />

        <AppButton
          label="Присоединиться"
          large
          onPress={handleJoin}
          loading={joining}
          disabled={code.length < 4}
        />

        <InlineBanner
          tone="info"
          message="Если вы ребёнок, после входа приложение попросит разрешение на геолокацию — это нужно, чтобы родители видели вас на карте."
        />
      </View>
    </Screen>
  );
}
