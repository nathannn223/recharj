import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fontFamily, radii } from '@/constants/theme';

type Point = { x: number; y: number };

// Freehand signature capture built on PanResponder + a plain SVG path — no
// drawing library in the project's dependencies, and a single stroke path is
// simple enough not to need one. Only the gesture matters here, not what the
// signature actually looks like: nothing is persisted or sent anywhere, this
// is a commitment ritual, not a legal signature.
export function SignaturePad({ onChange }: { onChange?: (hasSignature: boolean) => void }) {
  const { t } = useTranslation();
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const currentStroke = useRef<Point[]>([]);
  const [, forceRender] = useState(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentStroke.current = [{ x: locationX, y: locationY }];
          forceRender((n) => n + 1);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentStroke.current = [...currentStroke.current, { x: locationX, y: locationY }];
          forceRender((n) => n + 1);
        },
        onPanResponderRelease: () => {
          if (currentStroke.current.length > 1) {
            const stroke = currentStroke.current;
            // onChange runs here, as a plain side effect after the state
            // update — not inside setStrokes' updater function. Calling a
            // different component's setState from within an updater
            // (setSignatureGiven, via onChange) breaks React's "updaters
            // must be pure" rule; it produced a real "Cannot update a
            // component while rendering a different component" error and,
            // with it, a remount that wiped the stroke that had just been
            // drawn.
            setStrokes((prev) => [...prev, stroke]);
            onChange?.(true);
          }
          currentStroke.current = [];
        },
      }),
    [onChange]
  );

  const clear = () => {
    setStrokes([]);
    currentStroke.current = [];
    onChange?.(false);
    forceRender((n) => n + 1);
  };

  const allStrokes = currentStroke.current.length > 1 ? [...strokes, currentStroke.current] : strokes;

  return (
    <View>
      <View style={styles.pad} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {allStrokes.map((stroke, i) => (
            <Path key={i} d={pathFromPoints(stroke)} stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      {strokes.length > 0 && (
        <View style={styles.clearRow}>
          <Pressable onPress={clear} hitSlop={8}>
            <Text style={styles.clearText}>{t('common.clear')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return '';
  return points.reduce((d, p, i) => d + `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} `, '');
}

const styles = StyleSheet.create({
  pad: {
    height: 140,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearRow: { alignItems: 'flex-end', marginTop: 6 },
  clearText: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textFaint, textDecorationLine: 'underline' },
});
