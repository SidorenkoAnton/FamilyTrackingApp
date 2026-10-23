import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { groupsApi } from '../api';
import {
  AppButton,
  AppText,
  Card,
  InlineBanner,
  Screen,
  Skeleton,
  useToast,
} from '../components/ui';
import { INVITE_TTL_MINUTES } from '../constants/config';
import { radius, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import { useNow } from '../hooks/useAutoRefresh';
import type { GroupsScreenProps } from '../navigation/types';
import type { Invite } from '../types';
import { getErrorMessage } from '../utils/errors';
import { countdown } from '../utils/format';

export function CreateInviteScreen({ route }: GroupsScreenProps<'CreateInvite'>) {
  const { groupId, groupName } = route.params;
  const { colors } = useAppTheme();
  const toast = useToast();
  const now = useNow(1_000);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createdRef = useRef(false);

  const create = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupsApi.createInvite(groupId, 'child', INVITE_TTL_MINUTES);
      setInvite(data);
    } catch (createError) {
      setError(getErrorMessage(createError, 'Не удалось создать код'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Creating the code immediately removes one tap from the invite flow.
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void create();
  }, [create]);

  const countdownState =
    invite?.expiresAt != null ? countdown(invite.expiresAt, now) : null;
  const expired = countdownState?.expired ?? false;

  const handleCopy = async () => {
    if (!invite) return;
    try {
      await Clipboard.setStringAsync(invite.code);
      toast.show('Код скопирован');
    } catch {
      toast.show('Не удалось скопировать код', { tone: 'error' });
    }
  };

  const handleShare = async () => {
    if (!invite) return;
    try {
      await Share.share({
        message: [
          `Вступайте в семейную группу «${groupName ?? 'Family Tracker'}».`,
          `Код приглашения: ${invite.code}`,
          `Код действует ${INVITE_TTL_MINUTES} минут.`,
        ].join('\n'),
      });
    } catch {
      toast.show('Не удалось поделиться кодом', { tone: 'error' });
    }
  };

  return (
    <Screen scroll edges={['bottom']} padded>
      <View style={{ gap: spacing.lg }}>
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="account-child-outline"
              size={28}
              color={colors.primary}
            />
          </View>

          <AppText variant="overline" tone="textTertiary" style={{ marginTop: spacing.md }}>
            КОД ПРИГЛАШЕНИЯ
          </AppText>

          {loading ? (
            <Skeleton
              width={220}
              height={56}
              radius={radius.md}
              style={{ marginVertical: spacing.lg }}
            />
          ) : invite ? (
            <CodeBoxes code={invite.code} />
          ) : (
            <View style={{ height: spacing.xl }} />
          )}

          {invite ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={expired ? colors.danger : colors.textSecondary}
              />
              <AppText variant="caption" tone={expired ? 'danger' : 'textSecondary'}>
                {countdownState
                  ? expired
                    ? 'Код истёк'
                    : `Действует ещё ${countdownState.label}`
                  : `Действует ${INVITE_TTL_MINUTES} минут`}
              </AppText>
            </View>
          ) : null}
        </Card>

        {error ? (
          <InlineBanner
            message={error}
            tone="danger"
            actionLabel="Повторить"
            onAction={create}
          />
        ) : null}

        <AppButton
          label="Скопировать код"
          icon="content-copy"
          large
          onPress={handleCopy}
          disabled={!invite || expired}
        />
        <AppButton
          label="Поделиться"
          mode="outlined"
          icon="share-variant-outline"
          onPress={handleShare}
          disabled={!invite || expired}
        />
        <AppButton
          label={expired ? 'Создать новый код' : 'Обновить код'}
          mode="text"
          icon="refresh"
          onPress={create}
          loading={loading}
        />

        <Card>
          <AppText variant="bodyStrong">Как это работает</AppText>
          <AppText
            variant="body"
            tone="textSecondary"
            style={{ marginTop: spacing.xs }}
          >
            Отправьте код ребёнку. В его приложении: «Группы» → «Войти по коду».
            После входа он разрешит геолокацию — и вы увидите его на карте.
          </AppText>
        </Card>
      </View>
    </Screen>
  );
}

function CodeBoxes({ code }: { code: string }) {
  const { colors } = useAppTheme();
  const fontFamily = Platform.select({ ios: 'Menlo', android: 'monospace' });

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
        marginVertical: spacing.lg,
      }}
    >
      {code.split('').map((character, index) => (
        <View
          key={`${character}-${index}`}
          style={{
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 30,
            maxWidth: 48,
            height: 56,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceMuted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="headline" style={{ fontFamily, letterSpacing: 0 }}>
            {character}
          </AppText>
        </View>
      ))}
    </View>
  );
}
