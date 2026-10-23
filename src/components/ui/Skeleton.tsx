import React, { useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius } from '../../design/tokens';
import { useAppTheme } from '../../design/ThemeContext';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder used while the first screen of data loads. */
export function Skeleton({ width = '100%', height = 16, radius: r = radius.xs, style }: SkeletonProps) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}
