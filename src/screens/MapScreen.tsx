import {
  Camera,
  LocationManager,
  Map,
  Marker,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { locationsApi } from '../api';
import {
  AppText,
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  IconAction,
  InlineBanner,
  Skeleton,
  useToast,
} from '../components/ui';
import {
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  LOCATION_POLL_INTERVAL_MS,
  MAP_STYLE_URL,
} from '../constants/config';
import { radius, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import { useAutoRefresh, useNow } from '../hooks/useAutoRefresh';
import type { TabScreenProps } from '../navigation/types';
import type { MemberLocation } from '../types';
import { getErrorMessage } from '../utils/errors';
import {
  formatAccuracy,
  formatBattery,
  plural,
  presenceOf,
  shortTimeAgo,
  timeAgo,
} from '../utils/format';
import { openInMaps } from '../utils/linking';

type LoadMode = 'initial' | 'refresh' | 'silent';

const displayName = (member: MemberLocation): string =>
  member.user.name?.trim() || member.user.email.split('@')[0] || 'Участник';

export function MapScreen({ navigation }: TabScreenProps<'Map'>) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const now = useNow(20_000);
  const cameraRef = useRef<CameraRef>(null);

  const [locations, setLocations] = useState<MemberLocation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleError, setStaleError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const hasDataRef = useRef(false);
  const didAutoFitRef = useRef(false);

  useEffect(() => {
    hasDataRef.current = locations.length > 0;
  }, [locations]);

  const load = useCallback(async (mode: LoadMode = 'silent') => {
    if (mode === 'initial') setInitialLoading(true);
    if (mode === 'refresh') setRefreshing(true);

    try {
      const data = await locationsApi.latest();
      setLocations(data);
      setLastUpdated(Date.now());
      setError(null);
      setStaleError(null);
      setSelectedUserId((current) =>
        current && data.some((item) => item.user.id === current) ? current : null,
      );
    } catch (loadError) {
      const message = getErrorMessage(loadError, 'Не удалось загрузить местоположения');
      if (hasDataRef.current) {
        setStaleError(message);
      } else {
        setError(message);
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(hasDataRef.current ? 'silent' : 'initial');
    }, [load]),
  );

  useAutoRefresh(() => load('silent'), LOCATION_POLL_INTERVAL_MS);

  const selected = useMemo(
    () => locations.find((item) => item.user.id === selectedUserId) ?? null,
    [locations, selectedUserId],
  );

  const fitAll = useCallback(() => {
    if (locations.length === 0) return;

    // "Show everyone" also clears the focused member card.
    setSelectedUserId(null);

    if (locations.length === 1) {
      const only = locations[0];
      cameraRef.current?.flyTo({
        center: [only.longitude, only.latitude],
        zoom: 15,
        duration: 700,
      });
      return;
    }

    const longitudes = locations.map((item) => item.longitude);
    const latitudes = locations.map((item) => item.latitude);

    cameraRef.current?.fitBounds(
      [
        Math.min(...longitudes),
        Math.min(...latitudes),
        Math.max(...longitudes),
        Math.max(...latitudes),
      ],
      {
        padding: {
          top: 140,
          right: 64,
          // Leave room for the member carousel at the bottom.
          bottom: 220,
          left: 64,
        },
        duration: 800,
      },
    );
  }, [locations]);

  // Frame everybody once, as soon as both the map and the data are ready.
  useEffect(() => {
    if (didAutoFitRef.current || !mapReady || locations.length === 0) return;
    didAutoFitRef.current = true;
    const timeout = setTimeout(fitAll, 300);
    return () => clearTimeout(timeout);
  }, [fitAll, locations.length, mapReady]);

  // With nobody to show, open the map where the user actually is.
  useEffect(() => {
    if (!mapReady || locations.length > 0) return;
    let cancelled = false;

    void (async () => {
      try {
        const position = await LocationManager.getCurrentPosition();
        if (!cancelled && position) {
          cameraRef.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 13,
            duration: 600,
          });
        }
      } catch {
        // Keep the fallback city view.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locations.length, mapReady]);

  const focusMember = useCallback((member: MemberLocation) => {
    setSelectedUserId(member.user.id);
    cameraRef.current?.flyTo({
      center: [member.longitude, member.latitude],
      zoom: 15.5,
      duration: 900,
    });
  }, []);

  const goToMe = useCallback(async () => {
    try {
      const position = await Promise.race([
        LocationManager.getCurrentPosition(),
        new Promise<undefined>((resolve) => {
          setTimeout(() => resolve(undefined), 8_000);
        }),
      ]);

      if (!position) {
        toast.show('Не удалось определить ваше местоположение', { tone: 'error' });
        return;
      }
      cameraRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 15.5,
        duration: 800,
      });
    } catch {
      toast.show('Не удалось определить ваше местоположение', { tone: 'error' });
    }
  }, [toast]);

  if (mapError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <ErrorState
          title="Карта не загрузилась"
          message="Не удалось загрузить стиль карты. Проверьте интернет и попробуйте снова."
          onRetry={() => {
            setMapError(false);
            setMapReady(false);
            didAutoFitRef.current = false;
            setMapKey((value) => value + 1);
          }}
        />
      </View>
    );
  }

  const count = locations.length;
  const selectedBattery = selected ? formatBattery(selected.batteryLevel) : null;
  const selectedMeta = selected
    ? [
        timeAgo(selected.updatedAt, now),
        formatAccuracy(selected.accuracy),
        selectedBattery ? `батарея ${selectedBattery}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const statusLine =
    count === 0
      ? 'Пока никого'
      : `${count} ${plural(count, 'участник', 'участника', 'участников')} · обновлено ${
          lastUpdated ? timeAgo(new Date(lastUpdated).toISOString(), now) : '…'
        }`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Map
        key={mapKey}
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        attribution
        attributionPosition={{ top: insets.top + 92, right: 12 }}
        compass={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onDidFailLoadingMap={() => setMapError(true)}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: INITIAL_MAP_CENTER, zoom: INITIAL_MAP_ZOOM }}
        />

        <UserLocation accuracy />

        {locations.map((member) => (
          <Marker
            key={member.user.id}
            id={member.user.id}
            lngLat={[member.longitude, member.latitude]}
            anchor="bottom"
            onPress={() => focusMember(member)}
          >
            <MemberMarker
              name={displayName(member)}
              email={member.user.email}
              status={presenceOf(member.updatedAt, now)}
              selected={member.user.id === selectedUserId}
            />
          </Marker>
        ))}
      </Map>

      {/* Floating header: the only persistent chrome on top of the map. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.lg,
          right: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surfaceFloating,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
            shadows.floating,
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: staleError
                    ? colors.warning
                    : count > 0
                      ? colors.success
                      : colors.textTertiary,
                }}
              />
              <AppText variant="overline" tone="textTertiary">
                СЕМЬЯ НА КАРТЕ
              </AppText>
            </View>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {statusLine}
            </AppText>
          </View>
          <IconAction
            icon="refresh"
            accessibilityLabel="Обновить местоположения"
            variant="soft"
            loading={refreshing}
            onPress={() => load('refresh')}
          />
        </View>

        {staleError ? (
          <InlineBanner
            message="Нет связи с сервером. Показаны последние данные."
            tone="warning"
            actionLabel="Обновить"
            onAction={() => load('silent')}
          />
        ) : null}
      </View>

      {/* Secondary map controls, kept away from the thumb zone. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: spacing.lg,
          bottom: selected ? 208 : 132,
          gap: spacing.sm,
          alignItems: 'center',
        }}
      >
        <IconAction
          icon="arrow-expand-all"
          accessibilityLabel="Показать всех на карте"
          onPress={fitAll}
          disabled={count === 0}
        />
        <IconAction
          icon="crosshairs-gps"
          accessibilityLabel="Моё местоположение"
          onPress={goToMe}
        />
      </View>

      {/* Bottom area: member carousel, selection card, empty/error states. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          gap: spacing.sm,
        }}
      >
        {initialLoading && count === 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Skeleton width={116} height={96} radius={18} />
            <Skeleton width={116} height={96} radius={18} />
            <Skeleton width={116} height={96} radius={18} />
          </View>
        ) : error && count === 0 ? (
          <Card padded={false}>
            <ErrorState
              compact
              title="Нет данных о местоположении"
              message={error}
              onRetry={() => load('initial')}
            />
          </Card>
        ) : count === 0 ? (
          <Card padded={false}>
            <EmptyState
              compact
              icon="account-multiple-plus-outline"
              title="На карте пока никого"
              description="Пригласите ребёнка в группу — его точка появится, как только он откроет приложение и разрешит доступ."
              actionLabel="Перейти в группы"
              onAction={() => navigation.navigate('Groups')}
            />
          </Card>
        ) : (
          <>
            {selected ? (
              <View
                style={[
                  styles.selectedCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                  shadows.floating,
                ]}
              >
                <Avatar
                  name={displayName(selected)}
                  email={selected.user.email}
                  size={42}
                  status={presenceOf(selected.updatedAt, now)}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {displayName(selected)}
                  </AppText>
                  <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
                    {selectedMeta}
                  </AppText>
                </View>
                <IconAction
                  icon="directions"
                  accessibilityLabel={`Построить маршрут к ${displayName(selected)}`}
                  variant="primary"
                  onPress={() =>
                    openInMaps(
                      selected.latitude,
                      selected.longitude,
                      displayName(selected),
                    )
                  }
                />
                <IconAction
                  icon="close"
                  accessibilityLabel="Скрыть карточку"
                  variant="ghost"
                  size={20}
                  onPress={() => setSelectedUserId(null)}
                />
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {locations.map((member) => (
                <MemberChip
                  key={member.id}
                  name={displayName(member)}
                  email={member.user.email}
                  status={presenceOf(member.updatedAt, now)}
                  timeLabel={shortTimeAgo(member.updatedAt, now)}
                  active={member.user.id === selectedUserId}
                  onPress={() => focusMember(member)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

function MemberMarker({
  name,
  email,
  status,
  selected,
}: {
  name: string;
  email: string;
  status: ReturnType<typeof presenceOf>;
  selected: boolean;
}) {
  const { colors, shadows } = useAppTheme();

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={[
          styles.markerRing,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            shadowColor: colors.shadow,
          },
          shadows.floating,
        ]}
      >
        <Avatar
          name={name}
          email={email}
          size={selected ? 50 : 42}
          status={status}
        />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: selected ? colors.primary : colors.surface,
          marginTop: -1,
        }}
      />
    </View>
  );
}

function MemberChip({
  name,
  email,
  status,
  timeLabel,
  active,
  onPress,
}: {
  name: string;
  email: string;
  status: ReturnType<typeof presenceOf>;
  timeLabel: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, shadows } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${timeLabel}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.memberChip,
        {
          backgroundColor: active ? colors.primarySoft : colors.surfaceFloating,
          borderColor: active ? colors.primary : colors.border,
          shadowColor: colors.shadow,
        },
        shadows.card,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Avatar name={name} email={email} size={40} status={status} />
      <View style={{ alignItems: 'center', gap: 1, width: '100%' }}>
        <AppText variant="label" numberOfLines={1}>
          {name}
        </AppText>
        <AppText
          variant="caption"
          tone={active ? 'onPrimarySoft' : 'textSecondary'}
          numberOfLines={1}
        >
          {timeLabel}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  markerRing: {
    padding: 3,
    borderRadius: radius.pill,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  memberChip: {
    width: 116,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
