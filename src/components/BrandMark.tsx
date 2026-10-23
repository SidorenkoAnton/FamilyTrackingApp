import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View } from 'react-native';
import { radius } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';

/** Rounded-square app mark used on the loading and auth screens. */
export function BrandMark({ size = 64 }: { size?: number }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: `${colors.primary}22`,
      }}
    >
      <View
        style={{
          width: size * 0.66,
          height: size * 0.66,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="shield-home"
          size={size * 0.36}
          color={colors.onPrimary}
        />
      </View>
    </View>
  );
}
