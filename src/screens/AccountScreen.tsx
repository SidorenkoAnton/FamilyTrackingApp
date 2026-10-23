import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, RefreshControl, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import {
  AppBar,
  AppButton,
  AppText,
  Avatar,
  Badge,
  Card,
  ListRow,
  Screen,
  Section,
  useToast,
} from '../components/ui';
import { APP_VERSION } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { radius, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import type { ThemeMode } from '../design/tokens';
import { isTrackingSupported } from '../services/BackgroundLocationService';
import {
  getLocationPermissionSummary,
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
  type LocationPermissionSummary,
} from '../utils/permissions';
import { openAppSettings, openBatteryOptimizationSettings } from '../utils/linking';

export function AccountScreen() {
  const { user, trackingActive, isChildRole, logout, refreshUser, setupTracking, syncTracking } =
    useAuth();
  const { colors, isDark, mode, setMode } = useAppTheme();
  const toast = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [permissions, setPermissions] = useState<LocationPermissionSummary | null>(null);
  const [trackingBusy, setTrackingBusy] = useState(false);

  const reloadPermissions = useCallback(async () => {
    const summary = await getLocationPermissionSummary();
    setPermissions(summary);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadPermissions();
      void syncTracking();
    }, [reloadPermissions, syncTracking]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await reloadPermissions();
      await syncTracking();
    } catch {
      toast.show('Не удалось обновить профиль', { tone: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePermissions = async () => {
    const foregroundGranted = await requestForegroundLocationPermission();
    if (!foregroundGranted) {
      toast.show('Разрешите доступ к геолокации в настройках', { tone: 'error' });
      await openAppSettings();
      await reloadPermissions();
      return;
    }

    const backgroundGranted = await requestBackgroundLocationPermission();
    await reloadPermissions();
    await syncTracking();

    toast.show(
      backgroundGranted
        ? 'Геолокация разрешена всегда'
        : 'Геолокация разрешена только при использовании приложения',
      { tone: backgroundGranted ? 'default' : 'error' },
    );
  };

  const handleSetupTracking = async () => {
    setTrackingBusy(true);
    try {
      const active = await setupTracking();
      await reloadPermissions();
      toast.show(
        active
          ? 'Отслеживание включено'
          : 'Не удалось включить отслеживание. Проверьте разрешения.',
        { tone: active ? 'default' : 'error' },
      );
    } finally {
      setTrackingBusy(false);
    }
  };

  const handleBatterySettings = async () => {
    const opened = await openBatteryOptimizationSettings();
    if (!opened) {
      toast.show('Не удалось открыть настройки батареи', { tone: 'error' });
    }
  };

  const handleCheckUpdates = async () => {
    if (!Updates.isEnabled) {
      toast.show('Обновления недоступны в этой сборке', { tone: 'error' });
      return;
    }

    setCheckingUpdates(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        toast.show('У вас последняя версия');
        return;
      }
      await Updates.fetchUpdateAsync();
      toast.show('Обновление загружено. Перезапустите приложение.');
    } catch {
      toast.show('Не удалось проверить обновления', { tone: 'error' });
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Выйти из аккаунта?', 'Фоновое отслеживание будет остановлено.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const permissionValue = permissions
    ? permissions.foreground
      ? permissions.background
        ? 'Всегда'
        : 'При использовании'
      : 'Нет доступа'
    : '…';

  const trackingSupported = isTrackingSupported();

  return (
    <Screen
      scroll
      edges={['top']}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <AppBar title="Аккаунт" subtitle="Профиль, доступы и приложение" />

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xxl }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar
              name={user?.name}
              email={user?.email}
              size={64}
              status={trackingActive ? 'online' : 'unknown'}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="headline" numberOfLines={1}>
                {user?.name?.trim() || 'Без имени'}
              </AppText>
              <AppText variant="body" tone="textSecondary" numberOfLines={1}>
                {user?.email}
              </AppText>
              <View style={{ marginTop: spacing.xs }}>
                <Badge
                  tone={trackingActive ? 'success' : 'neutral'}
                  icon={trackingActive ? 'shield-check-outline' : 'shield-outline'}
                  label={trackingActive ? 'Вы на карте' : 'Отслеживание выключено'}
                />
              </View>
            </View>
          </View>
        </Card>

        <Section title="Отслеживание">
          <Card padded={false}>
            <ListRow
              icon="map-marker-radius-outline"
              iconTone={trackingActive ? 'success' : 'neutral'}
              title="Фоновое отслеживание"
              subtitle={
                trackingSupported
                  ? 'Работает, когда вы участник с ролью «Ребёнок»'
                  : 'Доступно только в Android-сборке'
              }
              value={trackingActive ? 'Активно' : 'Выключено'}
              divider
              showChevron={false}
            />
            <ListRow
              icon="crosshairs-gps"
              iconTone="primary"
              title="Доступ к геолокации"
              subtitle="Нужен, чтобы вас видели на карте"
              value={permissionValue}
              onPress={handlePermissions}
            />
            {Platform.OS === 'android' ? (
              <ListRow
                icon="battery-heart-variant"
                iconTone="warning"
                title="Экономия батареи"
                subtitle="Некоторые прошивки останавливают фон"
                onPress={handleBatterySettings}
                divider={false}
              />
            ) : null}
          </Card>

          {trackingSupported && isChildRole && !trackingActive ? (
            <Card>
              <View style={{ gap: spacing.sm }}>
                <AppText variant="bodyStrong">Включить передачу местоположения</AppText>
                <AppText variant="caption" tone="textSecondary">
                  Вы ребёнок в семейной группе. Включите доступ «Всегда» — иначе
                  родители увидят вас только при открытом приложении.
                </AppText>
                <AppButton
                  label="Настроить отслеживание"
                  icon="shield-check-outline"
                  onPress={handleSetupTracking}
                  loading={trackingBusy}
                  style={{ marginTop: spacing.xs }}
                />
              </View>
            </Card>
          ) : null}
        </Section>

        <Section title="Приложение">
          <Card padded={false}>
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                gap: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name="theme-light-dark"
                    size={19}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">Тема</AppText>
                  <AppText variant="caption" tone="textSecondary">
                    {isDark ? 'Тёмная' : 'Светлая'}
                  </AppText>
                </View>
              </View>
              <SegmentedButtons
                value={mode}
                onValueChange={(value) => setMode(value as ThemeMode)}
                buttons={[
                  { value: 'light', label: 'Светлая' },
                  { value: 'dark', label: 'Тёмная' },
                ]}
              />
            </View>

            <ListRow
              icon="update"
              title="Обновления"
              subtitle="Проверить наличие новой версии"
              onPress={handleCheckUpdates}
              value={checkingUpdates ? 'Проверяем…' : undefined}
            />
            <ListRow
              icon="information-outline"
              title="Версия"
              value={APP_VERSION}
              showChevron={false}
              divider={false}
            />
          </Card>
        </Section>

        <Section title="Аккаунт">
          <Card padded={false}>
            <ListRow
              icon="logout"
              title="Выйти из аккаунта"
              subtitle="Фоновое отслеживание остановится"
              destructive
              showChevron={false}
              divider={false}
              onPress={handleLogout}
            />
          </Card>
        </Section>

        <AppText variant="caption" tone="textTertiary" center>
          Family Tracker · геолокация передаётся только участникам вашей группы
        </AppText>
      </View>
    </Screen>
  );
}
