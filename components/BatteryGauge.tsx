import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { chargeGradient, colors } from '@/constants/theme';

type Size = 'lg' | 'sm';

type Props = {
  level: number; // 0-100
  size?: Size;
  onPress?: () => void;
  style?: ViewStyle;
};

// Classic battery-icon aspect ratio (casing only, terminal excluded).
const ASPECT_RATIO = 248 / 122;

// 'lg' is the hero size: it fills the width of its container (edge-to-edge
// with whatever the screen already gives other full-width cards) and derives
// its height from the aspect ratio, so it reads as genuinely large on any
// phone instead of the fixed px that only looked right in the ~300px web
// mockup preview. 'sm' stays a fixed compact size for inline/secondary use.
const SIZES = {
  lg: { radius: 28, nubW: 22, nubH: '36%' as const, inset: 10 },
  sm: { w: 128, h: 63, radius: 14, nubW: 10, nubH: 26, inset: 6 },
};

export function BatteryGauge({ level, size = 'lg', onPress, style }: Props) {
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
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const coverWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  const radius = size === 'lg' ? SIZES.lg.radius : SIZES.sm.radius;
  const inset = size === 'lg' ? SIZES.lg.inset : SIZES.sm.inset;
  const windowRadius = radius - 11;

  // Outer container carries the size + drop shadow and is never clipped, so
  // the terminal nub (which deliberately sits partly outside the casing)
  // and the shadow both stay visible. The inner `body` is the only view
  // with overflow:hidden, purely to round the gradient fill's corners —
  // on iOS a clipped view also clips its own shadow, hence the split.
  const outerStyle: ViewStyle =
    size === 'lg' ? { width: '100%', aspectRatio: ASPECT_RATIO } : { width: SIZES.sm.w, height: SIZES.sm.h };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Batterie sociale : ${clamped} pourcent`}
      style={style}
    >
      <Animated.View style={[outerStyle, styles.outer, { transform: [{ scale: pressAnim }] }]}>
        <View style={[styles.body, StyleSheet.absoluteFillObject, { borderRadius: radius }]}>
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
              position: 'absolute',
              top: inset,
              left: inset,
              right: inset,
              bottom: inset,
              borderRadius: windowRadius,
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

          {/* bottom rim — reads as the object's thickness */}
          <LinearGradient
            colors={['rgba(8,5,15,0)', 'rgba(8,5,15,0.7)']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: size === 'lg' ? '14%' : Math.round(SIZES.sm.h * 0.13),
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
            }}
            pointerEvents="none"
          />
        </View>

        {/* terminal nub — sibling of `body`, sits outside its clip bounds */}
        <View
          style={
            size === 'lg'
              ? {
                  position: 'absolute',
                  right: -Math.round(SIZES.lg.nubW * 0.55),
                  top: '32%',
                  height: SIZES.lg.nubH,
                  width: SIZES.lg.nubW,
                  borderTopRightRadius: 12,
                  borderBottomRightRadius: 12,
                  backgroundColor: '#5B4A87',
                }
              : {
                  position: 'absolute',
                  right: -Math.round((SIZES.sm.nubW as number) * 0.6),
                  top: '50%',
                  marginTop: -(SIZES.sm.nubH as number) / 2,
                  width: SIZES.sm.nubW,
                  height: SIZES.sm.nubH,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                  backgroundColor: '#5B4A87',
                }
          }
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    shadowColor: '#06030E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
  },
  body: {
    overflow: 'hidden',
  },
});
