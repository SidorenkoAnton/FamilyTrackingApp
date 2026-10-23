import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarHues, avatarTintAlpha } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';
import type { PresenceStatus } from '../../types';

export type { PresenceStatus };

export interface AvatarProps {
  name?: string | null;
  email?: string | null;
  size?: number;
  status?: PresenceStatus;
  /** Draw a colored ring around the avatar (selected map member). */
  ringColor?: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function getInitials(name?: string | null, email?: string | null): string {
  const clean = (name ?? '').trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean[0].toUpperCase();
  }

  const mail = (email ?? '').trim();
  return mail ? mail[0].toUpperCase() : '?';
}

/**
 * Initial-based avatar. The hue is derived from the name, so each family
 * member keeps a stable, recognizable color without uploading photos.
 */
export function Avatar({
  name,
  email,
  size = 44,
  status = 'unknown',
  ringColor,
}: AvatarProps) {
  const { colors } = useAppTheme();
  const label = getInitials(name, email);
  const hue = avatarHues[hashString(`${name ?? ''}${email ?? ''}` || 'family') % avatarHues.length];
  const dotSize = Math.max(10, Math.round(size * 0.26));

  const dotColor =
    status === 'online'
      ? colors.success
      : status === 'recent'
        ? colors.warning
        : status === 'offline'
          ? colors.borderStrong
          : undefined;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${hue}${avatarTintAlpha}`,
          borderWidth: ringColor ? 2.5 : 0,
          borderColor: ringColor ?? 'transparent',
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          color: hue,
          fontSize: Math.max(11, Math.round(size * 0.38)),
          fontWeight: '700',
          letterSpacing: 0.3,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {label}
      </Text>

      {dotColor ? (
        <View
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
