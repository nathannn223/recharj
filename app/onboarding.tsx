import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import { BoltIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useOnboarding } from '@/lib/onboarding';

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  illustration: React.ReactNode;
};

function ChartIllustration() {
  return (
    <Svg width={160} height={90} viewBox="0 0 160 90">
      <Defs>
        <SvgLinearGradient id="onbArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.violetSoft} stopOpacity={0.5} />
          <Stop offset="1" stopColor={colors.violetSoft} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M0,30 L25,20 L50,55 L75,65 L100,35 L125,20 L160,15 L160,90 L0,90 Z" fill="url(#onbArea)" />
      <Path
        d="M0,30 L25,20 L50,55 L75,65 L100,35 L125,20 L160,15"
        fill="none"
        stroke={colors.coral}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={75} cy={65} r={5} fill={colors.surfaceScreen} stroke={colors.lime} strokeWidth={2.5} />
    </Svg>
  );
}

function FlipIllustration() {
  return (
    <View style={styles.flipIllustration}>
      <View style={[styles.flipCardMini, styles.flipCardBack]} />
      <View style={styles.flipCardMini}>
        <BoltIcon color={colors.surfaceScreen} size={22} />
      </View>
    </View>
  );
}

function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={1} y={1} width={38} height={38} rx={12} fill="url(#onbLogo)" />
      <Path d="M22 9 12 22h7l-1 9 11-14h-8z" fill={colors.ink} />
      <Defs>
        <SvgLinearGradient id="onbLogo" x1="0" y1="0" x2="40" y2="40">
          <Stop offset="0" stopColor={colors.violet} />
          <Stop offset="0.55" stopColor={colors.coral} />
          <Stop offset="1" stopColor={colors.lime} />
        </SvgLinearGradient>
      </Defs>
    </Svg>
  );
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Le concept',
    title: 'Ta batterie sociale, sous contrôle',
    body: "Chaque événement social a un coût différent selon sa difficulté. Recharj projette l'impact sur ton énergie pour que tu voies venir la fatigue avant qu'elle arrive.",
    illustration: <BatteryGauge level={64} size="sm" />,
  },
  {
    eyebrow: 'Planifier',
    title: 'Ajoute un événement, on projette le reste',
    body: 'Indique le type et le niveau de difficulté ressentie — Recharj calcule ta projection sur les jours suivants et repère les moments qui demanderont plus de récupération.',
    illustration: <ChartIllustration />,
  },
  {
    eyebrow: 'Progresser',
    title: 'Des cours en cartes à retourner',
    body: 'Chaque carte cache un conseil concret, sourcé par de vraies études. Touche une carte pour la retourner et découvrir le conseil au dos.',
    illustration: <FlipIllustration />,
  },
  {
    eyebrow: "C'est parti",
    title: 'Prêt à recharger ?',
    body: 'Ton tableau de bord t\'attend. Ajoute ton premier événement dès que tu veux.',
    illustration: <LogoMark />,
  },
];

export default function OnboardingScreen() {
  const { markSeen } = useOnboarding();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const next = () => {
    if (isLast) {
      markSeen();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.body}>
          <View style={styles.illustrationWrap}>{slide.illustration}</View>
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.body}</Text>
        </View>

        <View style={styles.footer}>
          {index > 0 && (
            <Pressable style={styles.skipBtn} onPress={() => setIndex((i) => i - 1)} hitSlop={10}>
              <Text style={styles.skipText}>Précédent</Text>
            </Pressable>
          )}
          {!isLast && index === 0 && (
            <Pressable style={styles.skipBtn} onPress={markSeen} hitSlop={10}>
              <Text style={styles.skipText}>Passer</Text>
            </Pressable>
          )}
          <Pressable style={{ flex: 1 }} onPress={next}>
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1, padding: spacing[6], paddingTop: spacing[7], paddingBottom: spacing[6] },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.lime, width: 20 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  illustrationWrap: { height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2] },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontFamily: fontFamily.displayBold, fontSize: 26, color: colors.text, textAlign: 'center', lineHeight: 32 },
  subtitle: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, textAlign: 'center', lineHeight: 23, maxWidth: 320 },

  footer: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  skipBtn: { paddingVertical: 16, paddingHorizontal: 10 },
  skipText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textFaint },
  nextBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  nextBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },

  flipIllustration: { width: 90, height: 100 },
  flipCardMini: {
    position: 'absolute',
    width: 90,
    height: 100,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCardBack: { transform: [{ translateX: 10 }, { translateY: 10 }], opacity: 0.5 },
});
