import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import {
  BellIcon,
  BoltIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  HeartIcon,
  LockIcon,
  MoonIcon,
  StarIcon,
  SunIcon,
  UserIcon,
} from '@/components/icons/Icon';
import { FeatureCarousel } from '@/components/onboarding/FeatureCarousel';
import { IllustrationBadge } from '@/components/onboarding/IllustrationBadge';
import { SignaturePad } from '@/components/onboarding/SignaturePad';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import { MOMENT_OPTIONS } from '@/lib/momentOfDay';
import { scheduleDailyReminder } from '@/lib/notifications';
import { OBSTACLES } from '@/lib/obstacles';
import { useOnboarding } from '@/lib/onboarding';
import { PAIN_TYPES } from '@/lib/painTypes';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';
import { PLANS, TRIAL_DAYS, TRIAL_RENEWAL_TEXT, type Plan } from '@/lib/plans';
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

const CONTRACT_COMMITMENTS = ['Je vais suivre ma batterie.', 'Je vais mieux me connaître.', 'Je vais avancer à mon rythme.'];

const TIMELINE = [
  { day: 'Aujourd’hui', text: 'Accès complet débloqué.', icon: 'bolt' as const },
  { day: `Jour ${TRIAL_DAYS - 2}`, text: 'Rappel avant la fin.', icon: 'bell' as const },
  { day: `Jour ${TRIAL_DAYS}`, text: 'Premier prélèvement, résiliable avant.', icon: 'check' as const },
];

function TimelineIcon({ kind }: { kind: 'bolt' | 'bell' | 'check' }) {
  if (kind === 'bolt') return <BoltIcon color={colors.lime} size={22} />;
  if (kind === 'bell') return <BellIcon color={colors.violetSoft} size={22} />;
  return <CheckIcon color={colors.coral} size={22} />;
}

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
  MOMENT: 8,
  AUTHORITY: 9,
  FEATURES: 10,
  STREAK: 11,
  NOTIFICATIONS: 12,
  UNIQUE: 13,
  CONTRACT: 14,
  RECAP: 15,
  TRIAL: 16,
  SIGNUP: 17,
  CHECK_EMAIL: 18,
} as const;

// The battery fills silently as the user answers each of the eight
// questions (NAME through MOMENT), no caption explaining the mechanic. It
// reaches full on the last question and stays full for the rest of the flow.
function batteryLevelForStep(step: number): number | undefined {
  if (step === STEP.HOOK) return undefined;
  if (step <= STEP.MOMENT) {
    const questionIndex = step - STEP.NAME;
    return Math.round((questionIndex / (STEP.MOMENT - STEP.NAME)) * 100);
  }
  return 100;
}

// Each button teases what the next step reveals instead of repeating
// "Continuer" at every screen.
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
      return 'Une dernière question';
    case STEP.MOMENT:
      return 'Voir pourquoi Recharj est différent';
    case STEP.AUTHORITY:
      return "Voir comment Recharj t'aide";
    case STEP.FEATURES:
      return 'Je veux que ça change';
    case STEP.STREAK:
      return 'Je ne veux pas la perdre';
    case STEP.UNIQUE:
      return "Je m'engage";
    case STEP.CONTRACT:
      return 'Confirmer mon engagement';
    case STEP.RECAP:
      return 'Voir mon plan personnalisé';
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
  const [momentIndex, setMomentIndex] = useState<number | null>(null);
  const [signatureGiven, setSignatureGiven] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan['id']>('annual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pain = painIndex !== null ? PAIN_TYPES[painIndex] : null;
  const momentLabel = momentIndex !== null ? MOMENT_OPTIONS[momentIndex] : null;

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
    (step === STEP.ANTICIPATION && anticipationIndex === null) ||
    (step === STEP.MOMENT && momentIndex === null) ||
    (step === STEP.CONTRACT && !signatureGiven);

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
      lowBatteryMoment: momentLabel ?? '',
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
  // through the exact same signUp() path as a real user. Never rendered in
  // production (__DEV__).
  const devQuickSignUp = async () => {
    const testEmail = `dev+${Date.now()}@recharj.dev`;
    const testPassword = 'DevTest123!';
    setFirstName('Dev');
    setScore(5);
    setPainIndex(0);
    setMomentIndex(0);
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
      lowBatteryMoment: MOMENT_OPTIONS[0],
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

  const requestNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        // Forces the same low-battery message the mock on this screen just
        // showed. Real day-to-day content takes over the first time the
        // Dashboard loads with real data. No streak exists yet at this
        // point, so scheduleCheckInReminder() isn't called here — the
        // Dashboard's own refresh (app/(tabs)/index.tsx) sets it up the
        // first time real streak data exists.
        await scheduleDailyReminder({ momentLabel: momentLabel ?? 'Le soir', batteryLevel: 0 });
      }
    } catch {
      // Permission prompt or scheduling failing (simulator, already denied
      // at OS level, etc.) should never block onboarding — just move on.
    }
    setStep((s) => s + 1);
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

  // The RECAP screen is the one place the top gauge shows the real
  // identified state instead of the "always full past MOMENT" placeholder
  // — it's the whole point of that screen, so the battery it shows here
  // finally means something again.
  const batteryLevel = step === STEP.RECAP && score !== null ? score * 10 : batteryLevelForStep(step);
  const isCustomFooterStep = step === STEP.NOTIFICATIONS || step === STEP.TRIAL;

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
              <Text style={styles.title}>Les sorties te vident vite ?</Text>
              <Text style={styles.tagline}>Recharj anticipe ta fatigue sociale.</Text>
              <Text style={styles.tagline}>Avant qu'elle arrive.</Text>
            </View>
          )}

          {step === STEP.NAME && (
            <View style={styles.question}>
              <IllustrationBadge icon={<UserIcon color={colors.violet} size={36} />} accent={colors.violet} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>Comment tu t'appelles ?</Text>
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
              <IllustrationBadge icon={<BoltIcon color={colors.coral} size={36} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{firstName}, ton aisance sociale aujourd'hui ?</Text>
              <View style={styles.slider}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Pressable key={n} onPress={() => setScore(n)} style={styles.sliderStep} hitSlop={4}>
                    <View style={[styles.sliderFill, score !== null && n > score && styles.sliderFillOff]} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                <Text style={styles.sliderLabel}>Pas à l'aise</Text>
                {score !== null && <Text style={styles.sliderValue}>{score}</Text>}
                <Text style={styles.sliderLabel}>Très à l'aise</Text>
              </View>
            </View>
          )}

          {step === STEP.PAIN && (
            <View style={styles.question}>
              <IllustrationBadge icon={<MoonIcon color={colors.violetSoft} size={36} />} accent={colors.violetSoft} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{firstName}, qu'est-ce qui te vide le plus d'énergie ?</Text>
              <ChoiceList options={PAIN_TYPES.map((p) => p.label)} selected={painIndex !== null ? [painIndex] : []} onToggle={setPainIndex} />
            </View>
          )}

          {step === STEP.OBSTACLE && (
            <View style={styles.question}>
              <IllustrationBadge icon={<LockIcon color={colors.violet} size={36} />} accent={colors.violet} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>Qu'est-ce qui te bloque ?</Text>
              <Text style={styles.questionSubtitle}>Choisis tout ce qui s'applique.</Text>
              <ChoiceList options={OBSTACLES} selected={obstacleIndices} onToggle={toggleObstacle} multi square />
            </View>
          )}

          {step === STEP.FREQUENCY && (
            <View style={styles.question}>
              <IllustrationBadge icon={<CalendarIcon color={colors.lime} size={36} />} accent={colors.lime} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{firstName}, à quel rythme ça t'arrive ?</Text>
              <ChoiceList
                options={EVENT_FREQUENCY_OPTIONS}
                selected={frequencyIndex !== null ? [frequencyIndex] : []}
                onToggle={setFrequencyIndex}
              />
            </View>
          )}

          {step === STEP.RECHARGE && (
            <View style={styles.question}>
              <IllustrationBadge icon={<SunIcon color={colors.lime} size={36} />} accent={colors.lime} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>Qu'est-ce qui te recharge le mieux ?</Text>
              <ChoiceList options={RECHARGE_OPTIONS} selected={rechargeIndex !== null ? [rechargeIndex] : []} onToggle={setRechargeIndex} />
            </View>
          )}

          {step === STEP.ANTICIPATION && (
            <View style={styles.question}>
              <IllustrationBadge icon={<ChevronRightIcon color={colors.coral} size={36} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>Un événement difficile arrive.</Text>
              <Text style={styles.questionTitle}>Tu réagis comment ?</Text>
              <ChoiceList
                options={ANTICIPATION_OPTIONS}
                selected={anticipationIndex !== null ? [anticipationIndex] : []}
                onToggle={setAnticipationIndex}
              />
            </View>
          )}

          {step === STEP.MOMENT && (
            <View style={styles.question}>
              <IllustrationBadge icon={<MoonIcon color={colors.violetSoft} size={36} />} accent={colors.violetSoft} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>À quel moment de la journée ta batterie est la plus basse ?</Text>
              <ChoiceList options={MOMENT_OPTIONS} selected={momentIndex !== null ? [momentIndex] : []} onToggle={setMomentIndex} />
            </View>
          )}

          {step === STEP.AUTHORITY && (
            <View style={styles.hero}>
              <Text style={styles.brandWordBig}>RECHARJ</Text>
              <Text style={styles.title}>N'est pas une app de plus.</Text>
              <Text style={styles.tagline}>Conçu pour les introvertis.</Text>
              <Text style={styles.tagline}>Basé sur de vraies études.</Text>
            </View>
          )}

          {step === STEP.FEATURES && (
            <View style={styles.hero}>
              <FeatureCarousel />
            </View>
          )}

          {step === STEP.STREAK && (
            <View style={styles.hero}>
              <StreakDemo />
            </View>
          )}

          {step === STEP.NOTIFICATIONS && (
            <View style={styles.hero}>
              <Text style={styles.notifHeroTitle}>Profite au maximum de Recharj</Text>
              <Text style={styles.tagline}>Autorise les notifications pour rester régulier.</Text>
              <NotificationMock momentLabel={momentLabel ?? 'ce soir'} />
            </View>
          )}

          {step === STEP.UNIQUE && (
            <View style={styles.hero}>
              <IllustrationBadge icon={<StarIcon color={colors.coral} size={34} />} accent={colors.coral} size={92} />
              <Text style={styles.title}>{firstName ? `${firstName}, tu es unique.` : 'Tu es unique.'}</Text>
              <Text style={styles.tagline}>Tu mérites d'être aidé.</Text>
            </View>
          )}

          {step === STEP.CONTRACT && (
            <View style={styles.question}>
              <IllustrationBadge icon={<HeartIcon color={colors.coral} size={34} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>Un engagement envers toi-même.</Text>
              <View style={styles.commitments}>
                {CONTRACT_COMMITMENTS.map((c) => (
                  <Text key={c} style={styles.commitmentLine}>
                    · {c}
                  </Text>
                ))}
              </View>
              <Text style={styles.signLabel}>Signe avec ton doigt.</Text>
              <SignaturePad onChange={setSignatureGiven} />
              {signatureGiven && (
                <View style={styles.signedRow}>
                  <CheckIcon color={colors.lime} size={16} />
                  <Text style={styles.signedText}>Engagé</Text>
                </View>
              )}
            </View>
          )}

          {step === STEP.RECAP && (
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Voici ce que Recharj a identifié</Text>
              <View style={styles.recapLines}>
                <Text style={styles.recapBig}>
                  Ton point faible : <Text style={styles.recapHlCoral}>{pain ? pain.label.toLowerCase() : 'ça'}</Text>.
                </Text>
                <Text style={styles.recapBig}>
                  Ça revient <Text style={styles.recapHlViolet}>{frequencyIndex !== null ? EVENT_FREQUENCY_OPTIONS[frequencyIndex].toLowerCase() : 'souvent'}</Text>,
                  surtout <Text style={styles.recapHlViolet}>{momentLabel?.toLowerCase()}</Text>.
                </Text>
                <Text style={styles.recapBig}>
                  Tu récupères mieux grâce à{' '}
                  <Text style={styles.recapHlLime}>{rechargeIndex !== null ? RECHARGE_OPTIONS[rechargeIndex].toLowerCase() : 'ce qui te fait du bien'}</Text>.
                </Text>
              </View>
            </View>
          )}

          {step === STEP.TRIAL && (
            <View style={styles.trial}>
              <Text style={styles.eyebrow}>Comment marche ton essai gratuit</Text>
              <View style={styles.timeline}>
                {TIMELINE.map((row, i) => (
                  <View key={row.day} style={styles.timelineRow}>
                    <View style={styles.timelineIconCol}>
                      <View style={styles.timelineIcon}>
                        <TimelineIcon kind={row.icon} />
                      </View>
                      {i < TIMELINE.length - 1 && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: spacing[5] }}>
                      <Text style={styles.timelineDay}>{row.day}</Text>
                      <Text style={styles.timelineText}>{row.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ gap: spacing[3] }}>
                {PLANS.map((plan) => {
                  const isSelected = plan.id === selectedPlan;
                  return (
                    <Pressable key={plan.id} onPress={() => setSelectedPlan(plan.id)} style={[styles.planCard, isSelected && styles.planCardSelected]}>
                      <View style={styles.trialBadge}>
                        <Text style={styles.trialBadgeText}>{TRIAL_DAYS} jours offerts</Text>
                      </View>
                      <View style={styles.planRow}>
                        <View style={[styles.radio, isSelected && styles.radioSelected]} />
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.planPrice}>
                          {plan.perMonth}
                          <Text style={styles.planPriceUnit}> / mois</Text>
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.footnote}>{TRIAL_RENEWAL_TEXT[selectedPlan]}</Text>
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

        {step === STEP.NOTIFICATIONS ? (
          <View style={styles.footer}>
            <Pressable style={{ flex: 1 }} onPress={requestNotifications}>
              <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Autoriser les notifications</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : step === STEP.TRIAL ? (
          <View style={styles.footer}>
            <Pressable style={{ flex: 1 }} onPress={() => setStep((s) => s + 1)}>
              <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Commencer mon essai gratuit</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
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
        )}
        {isCustomFooterStep && (
          <Pressable onPress={() => setStep((s) => s + 1)} style={styles.notifSkip} hitSlop={10}>
            <Text style={styles.skipText}>Plus tard</Text>
          </Pressable>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Lets the user trigger the exact moment the app is trying to make into a
// daily habit — filling in a day — instead of describing it. Nothing here
// is wired to real data (this runs before signup); tapping just proves out
// the payoff the real check-in delivers every night.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const HOLD_DURATION = 1800;
const RING_SIZE = 120;
const RING_RADIUS = 52;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Requires holding, not tapping — a single tap doesn't carry the same
// "effort → payoff" feeling a real nightly check-in does, and it's that
// feeling this demo exists to give a preview of, not just the end state.
function StreakDemo() {
  const [lit, setLit] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);

  const startHold = () => {
    if (lit) return;
    holdAnim.current = Animated.timing(fill, { toValue: 1, duration: HOLD_DURATION, useNativeDriver: false });
    holdAnim.current.start(({ finished }) => {
      if (!finished) return;
      setLit(true);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 24, bounciness: 14 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
        ]),
        Animated.timing(glow, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]).start();
    });
  };

  const cancelHold = () => {
    if (lit) return;
    holdAnim.current?.stop();
    Animated.timing(fill, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });
  const strokeDashoffset = fill.interpolate({ inputRange: [0, 1], outputRange: [RING_CIRCUMFERENCE, 0] });

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPressIn={startHold} onPressOut={cancelHold} hitSlop={16} disabled={lit}>
        <Animated.View style={[styles.flameWrap, lit && styles.flameWrapLit, { transform: [{ scale }] }]}>
          {lit && <Animated.View pointerEvents="none" style={[styles.flameGlow, { opacity: glowOpacity }]} />}
          <Svg width={RING_SIZE} height={RING_SIZE} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={colors.borderSoft} strokeWidth={RING_STROKE} fill="none" />
            {!lit && (
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.coral}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
              />
            )}
          </Svg>
          <FlameIcon color={lit ? colors.coral : colors.textFaint} size={56} />
        </Animated.View>
      </Pressable>
      <Text style={styles.title}>{lit ? 'Ta série a commencé.' : 'Chaque soir, fais le point.'}</Text>
      <Text style={styles.tagline}>{lit ? "Reviens chaque jour pour l'entretenir." : 'Reste appuyé pour remplir ta journée.'}</Text>
    </View>
  );
}

// Mimics a real iOS push notification (app icon, bold app name, timestamp,
// title, body) in the app's own palette, instead of describing what a
// notification looks like. The body uses the answer just given on the
// MOMENT step so it reads as personalized, and is written to make tapping
// it feel worth it rather than just informative.
function NotificationMock({ momentLabel }: { momentLabel: string }) {
  return (
    <View style={styles.notifCard}>
      <View style={styles.notifCardHeader}>
        <View style={styles.notifCardIcon}>
          <LogoMark size={20} />
        </View>
        <Text style={styles.notifCardApp}>RECHARJ</Text>
        <Text style={styles.notifCardTime}>maintenant</Text>
      </View>
      <Text style={styles.notifCardTitle}>Grosse baisse en vue</Text>
      <Text style={styles.notifCardBody}>Ta batterie sera basse {momentLabel.toLowerCase()}. Découvre comment t'y préparer.</Text>
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
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  notifHeroTitle: { fontFamily: fontFamily.displayBold, fontSize: 34, color: colors.coral, textAlign: 'center', lineHeight: 40 },
  brandWordBig: { fontFamily: fontFamily.displayBold, fontSize: 40, color: colors.lime, letterSpacing: 5, textAlign: 'center' },

  question: {},
  withIllustration: { marginTop: spacing[4] },
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

  commitments: { alignSelf: 'stretch', gap: spacing[2], marginTop: spacing[5] },
  commitmentLine: { fontFamily: fontFamily.textMedium, fontSize: 15, color: colors.textDim },
  signLabel: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textFaint, marginTop: spacing[5], marginBottom: spacing[2] },
  signedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[3] },
  signedText: { fontFamily: fontFamily.textBold, fontSize: 14, color: colors.lime, letterSpacing: 0.4 },

  flameWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    marginBottom: spacing[5],
  },
  flameWrapLit: { borderColor: 'rgba(255,122,107,0.5)' },
  flameGlow: { position: 'absolute', top: -14, left: -14, right: -14, bottom: -14, borderRadius: 74, backgroundColor: colors.coral },

  notifCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginTop: spacing[4],
    gap: 4,
    shadowColor: '#06030E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  notifCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifCardIcon: { width: 24, height: 24, borderRadius: 7, overflow: 'hidden' },
  notifCardApp: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.textFaint, letterSpacing: 0.6, flex: 1 },
  notifCardTime: { fontFamily: fontFamily.textMedium, fontSize: 11, color: colors.textFaint },
  notifCardTitle: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.text, marginTop: 4 },
  notifCardBody: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, lineHeight: 19 },

  recapLines: { gap: spacing[4], marginTop: spacing[3] },
  recapBig: { fontFamily: fontFamily.textSemiBold, fontSize: 21, color: colors.textDim, textAlign: 'center', lineHeight: 28 },
  recapHlCoral: { color: colors.coral, fontFamily: fontFamily.displaySemiBold },
  recapHlViolet: { color: colors.violetSoft, fontFamily: fontFamily.displaySemiBold },
  recapHlLime: { color: colors.lime, fontFamily: fontFamily.displaySemiBold },

  trial: { gap: spacing[6] },
  timeline: { marginTop: spacing[2] },
  timelineRow: { flexDirection: 'row', gap: spacing[4] },
  timelineIconCol: { alignItems: 'center' },
  timelineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: { flex: 1, width: 2, backgroundColor: colors.borderSoft, marginVertical: 4 },
  timelineDay: { fontFamily: fontFamily.textBold, fontSize: 18, color: colors.text },
  timelineText: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim, marginTop: 3 },

  planCard: { gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing[4], position: 'relative' },
  planCardSelected: { borderWidth: 1.5, borderColor: colors.coral, backgroundColor: 'rgba(255,122,107,0.06)' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { borderColor: colors.coral, backgroundColor: colors.coral },
  trialBadge: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 2 },
  trialBadgeText: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.surfaceScreen, letterSpacing: 0.3 },
  planName: { fontFamily: fontFamily.textBold, fontSize: 17, color: colors.text },
  planPrice: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text },
  planPriceUnit: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textDim },
  footnote: { fontFamily: fontFamily.textRegular, fontSize: 12, color: colors.textFaint, textAlign: 'center', lineHeight: 17 },

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
  notifSkip: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  nextBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center', paddingHorizontal: spacing[3] },
  nextBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen, textAlign: 'center' },
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
