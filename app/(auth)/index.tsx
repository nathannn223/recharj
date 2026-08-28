import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import { FlipCard } from '@/components/course/FlipCard';
import { BookIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { CourseCard } from '@/lib/courses';
import { useAuth } from '@/lib/auth';
import { PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import { OBSTACLES } from '@/lib/obstacles';
import { useOnboarding } from '@/lib/onboarding';
import { PAIN_TYPES } from '@/lib/painTypes';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';
import { ANTICIPATION_OPTIONS, EVENT_FREQUENCY_OPTIONS, RECHARGE_OPTIONS } from '@/lib/socialProfile';

function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={1} y={1} width={38} height={38} rx={12} fill="url(#authLogo)" />
      <Path d="M22 9 12 22h7l-1 9 11-14h-8z" fill={colors.ink} />
      <Defs>
        <SvgLinearGradient id="authLogo" x1="0" y1="0" x2="40" y2="40">
          <Stop offset="0" stopColor={colors.violet} />
          <Stop offset="0.55" stopColor={colors.coral} />
          <Stop offset="1" stopColor={colors.lime} />
        </SvgLinearGradient>
      </Defs>
    </Svg>
  );
}

// A real card from the course content, shown once during the quiz so the
// user tries the flip mechanic before signing up instead of reading a
// description of it. Kept short: the goal here is the gesture, not the
// content depth a real course card would have. Uses the liking gap
// (Boothby, Cooney, Sandstrom & Epley, 2018) rather than the more familiar
// mere exposure effect, for a stronger first impression.
const SAMPLE_CARD: CourseCard = {
  title: "L'écart de sympathie",
  advice:
    "Après une conversation, tu penses presque toujours avoir moins plu que la réalité. Des chercheurs ont mesuré cet écart en 2018. Ton interlocuteur t'a sans doute apprécié plus que tu ne le crois.",
  sourceId: null,
};

type Mode = 'quiz' | 'signin';

const STEP = {
  HOOK: 0,
  NAME: 1,
  DIAGNOSTIC: 2,
  PAIN: 3,
  OBSTACLE: 4,
  FREQUENCY: 5,
  RECHARGE: 6,
  ANTICIPATION: 7,
  EVENTS_INTRO: 8,
  COURSES_INTRO: 9,
  SAMPLE: 10,
  SIGNUP: 11,
  CHECK_EMAIL: 12,
} as const;

// The battery fills silently as the user answers each of the seven
// questions (NAME through ANTICIPATION), no caption explaining the
// mechanic. It reaches full on the last question and stays full through
// the two intro screens, the sample card and signup.
function batteryLevelForStep(step: number): number | undefined {
  if (step === STEP.HOOK) return undefined;
  if (step <= STEP.ANTICIPATION) {
    const questionIndex = step - STEP.NAME;
    return Math.round((questionIndex / (STEP.ANTICIPATION - STEP.NAME)) * 100);
  }
  return 100;
}

// Each button teases what the next step reveals instead of repeating
// "Continuer" at every screen — the user always knows what tapping it
// gets them, which is a stronger nudge than a neutral label.
function nextButtonLabel(step: number, submitting: boolean, firstName: string): string {
  if (step === STEP.SIGNUP) return submitting ? 'Un instant…' : 'Créer mon compte';
  switch (step) {
    case STEP.HOOK:
      return 'Je me reconnais';
    case STEP.NAME:
      return firstName.trim() ? 'Enchanté !' : 'Continuer';
    case STEP.DIAGNOSTIC:
      return 'Voir ce qui te vide le plus';
    case STEP.PAIN:
      return 'Voir ce qui te bloque';
    case STEP.OBSTACLE:
      return 'Voir ce qui revient le plus';
    case STEP.FREQUENCY:
      return 'Voir ce qui te recharge';
    case STEP.RECHARGE:
      return 'Un dernier point sur toi';
    case STEP.ANTICIPATION:
      return "Voir comment Recharj t'aide";
    case STEP.EVENTS_INTRO:
      return 'Voir les cours';
    case STEP.COURSES_INTRO:
      return 'Essayer une carte';
    case STEP.SAMPLE:
      return 'Je veux que ça change';
    default:
      return 'Continuer';
  }
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { resetSeen } = useOnboarding();
  const [mode, setMode] = useState<Mode>('quiz');
  const [step, setStep] = useState<number>(STEP.HOOK);

  const [firstName, setFirstName] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [painIndex, setPainIndex] = useState<number | null>(null);
  const [obstacleIndices, setObstacleIndices] = useState<number[]>([]);
  const [frequencyIndex, setFrequencyIndex] = useState<number | null>(null);
  const [rechargeIndex, setRechargeIndex] = useState<number | null>(null);
  const [anticipationIndex, setAnticipationIndex] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pain = painIndex !== null ? PAIN_TYPES[painIndex] : null;

  const toggleObstacle = (i: number) => {
    setObstacleIndices((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const blocked =
    submitting ||
    (step === STEP.NAME && !firstName.trim()) ||
    (step === STEP.DIAGNOSTIC && score === null) ||
    (step === STEP.PAIN && painIndex === null) ||
    (step === STEP.OBSTACLE && obstacleIndices.length === 0) ||
    (step === STEP.FREQUENCY && frequencyIndex === null) ||
    (step === STEP.RECHARGE && rechargeIndex === null) ||
    (step === STEP.ANTICIPATION && anticipationIndex === null);

  const submitSignUp = async () => {
    setError(null);
    if (!email || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setSubmitting(true);
    await savePendingOnboarding({
      firstName: firstName.trim(),
      baselineScore: score ?? 5,
      painType: pain?.label ?? '',
      obstacles: obstacleIndices.map((i) => OBSTACLES[i]),
      eventFrequency: frequencyIndex !== null ? EVENT_FREQUENCY_OPTIONS[frequencyIndex] : '',
      rechargeMethod: rechargeIndex !== null ? RECHARGE_OPTIONS[rechargeIndex] : '',
      anticipationStyle: anticipationIndex !== null ? ANTICIPATION_OPTIONS[anticipationIndex] : '',
    });
    const { error: signUpError, hasSession } = await signUp(email, password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      resetSeen();
      if (!hasSession) {
        setStep(STEP.CHECK_EMAIL);
      }
      // If a session came back immediately, RootNavigator picks it up and
      // routes into app/onboarding.tsx on its own. Nothing else to do here.
    }
  };

  // Dev-only: generates a fresh, guaranteed-unique test account and runs it
  // through the exact same signUp() path as a real user. Supabase still
  // requires a unique email per account, this just removes the tedium of
  // typing one by hand every time. Never rendered in production (__DEV__).
  const devQuickSignUp = async () => {
    const testEmail = `dev+${Date.now()}@recharj.dev`;
    const testPassword = 'DevTest123!';
    setFirstName('Dev');
    setScore(5);
    setPainIndex(0);
    setEmail(testEmail);
    setPassword(testPassword);
    setError(null);
    setSubmitting(true);
    await savePendingOnboarding({
      firstName: 'Dev',
      baselineScore: 5,
      painType: PAIN_TYPES[0].label,
      obstacles: [],
      eventFrequency: '',
      rechargeMethod: '',
      anticipationStyle: '',
    });
    const { error: signUpError, hasSession } = await signUp(testEmail, testPassword);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      resetSeen();
      if (!hasSession) setStep(STEP.CHECK_EMAIL);
    }
  };

  const submitSignIn = async () => {
    setError(null);
    if (!email || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  if (mode === 'signin') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView style={styles.kbView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <LogoMark />
              <Text style={styles.title}>Recharj</Text>
              <Text style={styles.tagline}>Ta batterie sociale, sous contrôle.</Text>
            </View>

            <View style={styles.form}>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="toi@exemple.com" keyboardType="email-address" />
              <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secure />

              {error && <Text style={styles.error}>{error}</Text>}

              <PrimaryButton label={submitting ? 'Un instant…' : 'Se connecter'} onPress={submitSignIn} disabled={submitting} />

              <Pressable onPress={() => setMode('quiz')} style={styles.switchMode}>
                <Text style={styles.switchModeText}>
                  Pas encore de compte ? <Text style={styles.switchModeLink}>Créer un compte</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- quiz mode ---

  if (step === STEP.CHECK_EMAIL) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <LogoMark />
            <Text style={styles.title}>Vérifie ta boîte mail</Text>
            <Text style={styles.tagline}>
              On a envoyé un lien de confirmation à {email}. Reviens ici et connecte-toi une fois ton compte confirmé.
            </Text>
          </View>
          <PrimaryButton label="Se connecter" onPress={() => setMode('signin')} />
        </View>
      </SafeAreaView>
    );
  }

  const batteryLevel = batteryLevelForStep(step);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.kbView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          {batteryLevel !== undefined && (
          <View style={styles.batteryHeader}>
            <BatteryGauge level={batteryLevel} size="sm" />
          </View>
        )}

        <View style={styles.body}>
          {step === STEP.HOOK && (
            <View style={styles.hero}>
              <LogoMark />
              <Text style={styles.title}>Les sorties te vident plus vite que tout le monde ?</Text>
              <Text style={styles.tagline}>
                Recharj te montre la fatigue sociale avant qu'elle arrive. Tu avances un peu à chaque événement que tu ajoutes.
              </Text>
            </View>
          )}

          {step === STEP.NAME && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>Comment tu t'appelles ?</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ton prénom"
                placeholderTextColor={colors.textFaint}
                style={[styles.input, { marginTop: spacing[5] }]}
                autoFocus
              />
            </View>
          )}

          {step === STEP.DIAGNOSTIC && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>{firstName}, à quel point te sens-tu à l'aise en société aujourd'hui ?</Text>
              <View style={styles.slider}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Pressable key={n} onPress={() => setScore(n)} style={styles.sliderStep} hitSlop={4}>
                    <View style={[styles.sliderFill, score !== null && n > score && styles.sliderFillOff]} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                <Text style={styles.sliderLabel}>Pas à l'aise du tout</Text>
                {score !== null && <Text style={styles.sliderValue}>{score}</Text>}
                <Text style={styles.sliderLabel}>Très à l'aise</Text>
              </View>
            </View>
          )}

          {step === STEP.PAIN && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>{firstName}, qu'est-ce qui te vide le plus ?</Text>
              <ChoiceList options={PAIN_TYPES.map((p) => p.label)} selected={painIndex !== null ? [painIndex] : []} onToggle={setPainIndex} />
            </View>
          )}

          {step === STEP.OBSTACLE && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>Qu'est-ce qui t'empêche de reprendre le contrôle ?</Text>
              <Text style={styles.questionSubtitle}>Choisis tout ce qui s'applique.</Text>
              <ChoiceList options={OBSTACLES} selected={obstacleIndices} onToggle={toggleObstacle} multi square />
            </View>
          )}

          {step === STEP.FREQUENCY && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>{firstName}, à quel rythme les situations difficiles reviennent dans ta semaine ?</Text>
              <ChoiceList
                options={EVENT_FREQUENCY_OPTIONS}
                selected={frequencyIndex !== null ? [frequencyIndex] : []}
                onToggle={setFrequencyIndex}
              />
            </View>
          )}

          {step === STEP.RECHARGE && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>Qu'est-ce qui te recharge le plus après une sortie qui t'a demandé de l'énergie ?</Text>
              <ChoiceList options={RECHARGE_OPTIONS} selected={rechargeIndex !== null ? [rechargeIndex] : []} onToggle={setRechargeIndex} />
            </View>
          )}

          {step === STEP.ANTICIPATION && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>Un évènement difficile arrive dans ton agenda. Tu réagis comment ?</Text>
              <ChoiceList
                options={ANTICIPATION_OPTIONS}
                selected={anticipationIndex !== null ? [anticipationIndex] : []}
                onToggle={setAnticipationIndex}
              />
            </View>
          )}

          {step === STEP.EVENTS_INTRO && (
            <View style={styles.hero}>
              <Text style={styles.title}>Ajoute tes évènements de la semaine</Text>
              <Text style={styles.tagline}>
                Recharj projette l'impact de chaque évènement sur ta batterie sociale, avant qu'il arrive. Pour ceux qui s'annoncent
                difficiles, on te propose un cours adapté.
              </Text>
              <WeekPreview />
            </View>
          )}

          {step === STEP.COURSES_INTRO && (
            <View style={styles.hero}>
              <Text style={styles.title}>Des mini cours basés sur de vraies études</Text>
              <Text style={styles.tagline}>
                Chaque carte te donne un conseil concret, tiré d'un vrai papier de recherche. Tu peux consulter la source si tu veux
                approfondir.
              </Text>
              <CardStackPreview />
            </View>
          )}

          {step === STEP.SAMPLE && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>Voici à quoi ressemble une carte de cours.</Text>
              <View style={{ marginTop: spacing[5] }}>
                <FlipCard card={SAMPLE_CARD} index={0} total={1} />
              </View>
            </View>
          )}

          {step === STEP.SIGNUP && (
            <View style={styles.form}>
              <Text style={styles.questionTitle}>Crée ton compte pour commencer</Text>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="toi@exemple.com" keyboardType="email-address" />
              <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
              {error && <Text style={styles.error}>{error}</Text>}
              <Text style={styles.consent}>
                En créant un compte, tu acceptes les{' '}
                <Text style={styles.consentLink} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
                  CGU
                </Text>{' '}
                et la{' '}
                <Text style={styles.consentLink} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
                  politique de confidentialité
                </Text>{' '}
                de Recharj.
              </Text>
            </View>
          )}
        </View>

        {__DEV__ && (
          <Pressable onPress={devQuickSignUp} disabled={submitting} style={styles.devBtn}>
            <Text style={styles.devBtnText}>⚡ DEV : compte de test instantané</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          {step === STEP.HOOK ? (
            <Pressable onPress={() => setMode('signin')} style={styles.skipBtn} hitSlop={10}>
              <Text style={styles.skipText}>Se connecter</Text>
            </Pressable>
          ) : (
            step < STEP.SIGNUP && (
              <Pressable onPress={() => setStep((s) => s - 1)} style={styles.skipBtn} hitSlop={10}>
                <Text style={styles.skipText}>Précédent</Text>
              </Pressable>
            )
          )}
          <Pressable
            style={{ flex: 1 }}
            disabled={blocked}
            onPress={() => {
              if (step === STEP.SIGNUP) {
                submitSignUp();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            <LinearGradient
              colors={chargeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.nextBtn, blocked && styles.btnDisabled]}
            >
              <Text style={styles.nextBtnText}>{nextButtonLabel(step, submitting, firstName)}</Text>
            </LinearGradient>
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Illustrative mockup of a projected week, not real data. Shows what the
// calendar will actually look like instead of describing it: bars trace a
// battery level per day, and a dot marks the two days with a hard event.
const WEEK_PREVIEW_DAYS = [
  { label: 'L', level: 82 },
  { label: 'M', level: 88 },
  { label: 'M', level: 55, event: true },
  { label: 'J', level: 40, event: true },
  { label: 'V', level: 62 },
  { label: 'S', level: 95 },
  { label: 'D', level: 100 },
];

function weekBarColor(level: number): string {
  if (level < 50) return colors.coral;
  if (level < 80) return colors.violetSoft;
  return colors.lime;
}

function WeekPreview() {
  return (
    <View style={styles.weekPreview}>
      {WEEK_PREVIEW_DAYS.map((d, i) => (
        <View key={i} style={styles.weekCol}>
          <View style={styles.weekDotSlot}>{d.event && <View style={styles.weekDot} />}</View>
          <View style={styles.weekBarTrack}>
            <View style={[styles.weekBarFill, { height: `${d.level}%`, backgroundColor: weekBarColor(d.level) }]} />
          </View>
          <Text style={styles.weekDayLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function CardStackPreview() {
  return (
    <View style={styles.cardStack}>
      <View style={[styles.cardStackLayer, styles.cardStackBack]} />
      <View style={[styles.cardStackLayer, styles.cardStackFront]}>
        <BookIcon color={colors.violetSoft} size={26} />
      </View>
    </View>
  );
}

function ChoiceList({
  options,
  selected,
  onToggle,
  multi,
  square,
}: {
  options: string[];
  selected: number[];
  onToggle: (i: number) => void;
  multi?: boolean;
  square?: boolean;
}) {
  return (
    <View style={{ gap: spacing[3], marginTop: spacing[5] }}>
      {options.map((label, i) => {
        const isSelected = selected.includes(i);
        return (
          <Pressable key={label} onPress={() => onToggle(i)} style={[styles.choice, isSelected && styles.choiceSelected]}>
            <View style={[square ? styles.bulletSquare : styles.bullet, isSelected && styles.bulletSelected]} />
            <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'email-address';
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        secureTextEntry={props.secure}
        keyboardType={props.keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ marginTop: spacing[2] }}>
      <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.nextBtn, disabled && styles.btnDisabled]}>
        <Text style={styles.nextBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  kbView: { flex: 1 },
  centered: { justifyContent: 'center' },
  content: { flex: 1, padding: spacing[6], paddingTop: spacing[7], paddingBottom: spacing[6], gap: spacing[4] },

  batteryHeader: { alignItems: 'center' },

  body: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing[3] },
  title: { fontFamily: fontFamily.displayBold, fontSize: 30, color: colors.text, textAlign: 'center', lineHeight: 36 },
  tagline: { fontFamily: fontFamily.textRegular, fontSize: 17, color: colors.textDim, textAlign: 'center', lineHeight: 24, maxWidth: 320 },

  weekPreview: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: spacing[3] },
  weekCol: { alignItems: 'center', gap: 6 },
  weekDotSlot: { height: 8, justifyContent: 'center' },
  weekDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral },
  weekBarTrack: { width: 12, height: 64, borderRadius: 6, backgroundColor: colors.borderSoft, justifyContent: 'flex-end', overflow: 'hidden' },
  weekBarFill: { width: '100%', borderRadius: 6 },
  weekDayLabel: { fontFamily: fontFamily.textMedium, fontSize: 11, color: colors.textFaint },

  cardStack: { width: 130, height: 88, marginTop: spacing[3] },
  cardStackLayer: {
    position: 'absolute',
    width: 104,
    height: 68,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  cardStackBack: { top: 18, left: 22, transform: [{ rotate: '-6deg' }] },
  cardStackFront: {
    top: 0,
    left: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.violet,
  },

  question: {},
  questionTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text, lineHeight: 30 },
  questionSubtitle: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textFaint, marginTop: spacing[2] },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slider: { flexDirection: 'row', gap: 4, marginTop: spacing[6], marginBottom: 10 },
  sliderStep: { flex: 1, height: 14 },
  sliderFill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.violetSoft },
  sliderFillOff: { backgroundColor: colors.borderSoft },
  sliderLabel: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  sliderValue: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral },

  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing[4] },
  choiceSelected: { borderColor: colors.violet, backgroundColor: 'rgba(108,79,224,0.14)' },
  bullet: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  bulletSquare: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border },
  bulletSelected: { borderColor: colors.violet, backgroundColor: colors.violet },
  choiceText: { flex: 1, fontFamily: fontFamily.textMedium, fontSize: 15, color: colors.textDim },
  choiceTextSelected: { color: colors.text },

  form: { gap: spacing[4] },
  consent: { fontFamily: fontFamily.textRegular, fontSize: 12, color: colors.textFaint, lineHeight: 17 },
  consentLink: { color: colors.textDim, textDecorationLine: 'underline' },
  fieldLabel: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: fontFamily.textMedium,
    fontSize: 16,
    color: colors.text,
  },
  error: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.critical },

  footer: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  skipBtn: { paddingVertical: 16, paddingHorizontal: 6 },
  skipText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textFaint },
  nextBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  nextBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  btnDisabled: { opacity: 0.4 },

  switchMode: { alignItems: 'center', marginTop: spacing[1] },
  switchModeText: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint },
  switchModeLink: { color: colors.textDim, fontFamily: fontFamily.textSemiBold, textDecorationLine: 'underline' },

  devBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.critical,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: spacing[2],
  },
  devBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 12, color: colors.critical },
});
