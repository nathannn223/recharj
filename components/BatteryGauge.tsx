import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { chargeGradient, colors, radii } from '@/constants/theme';

type Size = 'lg' | 'sm';

type Props = {
  level: number; // 0-100
  size?: Size;
  onPress?: () => void;
  style?: ViewStyle;
};

const DIMENSIONS: Record<Size, { w: number; h: number; radius: number; nubW: number; nubH: number; inset: number }> = {
  lg: { w: 248, h: 122, radius: 26, nubW: 16, nubH: 50, inset: 9 },
  sm: { w: 128, h: 63, radius: 14, nubW: 9, nubH: 26, inset: 6 },
};

// Physical battery object: classic icon silhouette (casing + terminal nub),
// rendered with soft directional shading. The window fills left-to-right,
// always revealing the same fixed charge gradient rather than recoloring it,
// exactly like the web identity artifact.
export function BatteryGauge({ level, size = 'lg', onPress, style }: Props) {
  const d = DIMENSIONS[size];
  const clamped = Math.max(0, Math.min(100, level));

  const widthAnim = useRef(new Animated.Value(100 - clamped)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: 100 - clamped,
      duration: 700,
      useNativeDriver: false, // width is not supported by the native driver
    }).start();
  }, [clamped, widthAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.965, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const coverWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Batterie sociale : ${clamped} pourcent`}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <View
          style={[
            styles.body,
            {
              width: d.w,
              height: d.h,
              borderRadius: d.radius,
            },
          ]}
        >
          <LinearGradient
            colors={['#372C54', '#1E1733', '#130D20']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
            start={{ x: 0.26, y: 0 }}
            end={{ x: 0.7, y: 0.7 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* window / fill area — deliberately dominant, thin bezel only */}
          <View
            style={{
              width: d.w - d.inset * 2,
              height: d.h - d.inset * 2,
              borderRadius: d.radius - 11,
              overflow: 'hidden',
              backgroundColor: colors.surfaceScreen,
            }}
          >
            <LinearGradient
              colors={chargeGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: coverWidth,
                backgroundColor: '#151022',
                borderLeftWidth: 2,
                borderLeftColor: 'rgba(244,241,252,0.22)',
              }}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '34%' }}
              pointerEvents="none"
            />
          </View>

          {/* terminal nub */}
          <View
            style={{
              position: 'absolute',
              right: -Math.round(d.nubW * 0.85),
              top: '50%',
              marginTop: -d.nubH / 2,
              width: d.nubW,
              height: d.nubH,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              backgroundColor: '#3E3260',
            }}
          />

          {/* bottom rim — reads as the object's thickness */}
          <LinearGradient
            colors={['rgba(8,5,15,0)', 'rgba(8,5,15,0.7)']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: Math.round(d.h * 0.13),
              borderBottomLeftRadius: d.radius,
              borderBottomRightRadius: d.radius,
            }}
            pointerEvents="none"
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06030E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
  },
});
