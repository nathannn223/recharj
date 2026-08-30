import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
import { MOMENT_IDS } from '@/lib/momentOfDay';
import { scheduleDailyReminder } from '@/lib/notifications';
import { OBSTACLE_IDS } from '@/lib/obstacles';
import { useOnboarding } from '@/lib/onboarding';
import { PAIN_TYPES } from '@/lib/painTypes';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';
import { getPlanDisplay, getTrialRenewalText, PLANS, TRIAL_DAYS, type Plan } from '@/lib/plans';
import { ANTICIPATION_IDS, EVENT_FREQUENCY_IDS, RECHARGE_IDS } from '@/lib/socialProfile';

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
function nextButtonLabel(step: number, submitting: boolean, firstName: string, t: (key: string) => string): string {
  if (step === STEP.SIGNUP) return submitting ? t('auth.buttons.submitting') : t('auth.buttons.createAccount');
  switch (step) {
    case STEP.HOOK:
      return t('auth.buttons.hook');
    case STEP.NAME:
      return firstName.trim() ? t('auth.buttons.nameFilled') : t('auth.buttons.continue');
    case STEP.DIAGNOSTIC:
      return t('auth.buttons.diagnostic');
    case STEP.PAIN:
      return t('auth.buttons.pain');
    case STEP.OBSTACLE:
      return t('auth.buttons.obstacle');
    case STEP.FREQUENCY:
      return t('auth.buttons.frequency');
    case STEP.RECHARGE:
      return t('auth.buttons.recharge');
    case STEP.ANTICIPATION:
      return t('auth.buttons.anticipation');
    case STEP.MOMENT:
      return t('auth.buttons.moment');
    case STEP.AUTHORITY:
      return t('auth.buttons.authority');
    case STEP.FEATURES:
      return t('auth.buttons.features');
    case STEP.STREAK:
      return t('auth.buttons.streak');
    case STEP.UNIQUE:
      return t('auth.buttons.unique');
    case STEP.CONTRACT:
      return t('auth.buttons.contract');
    case STEP.RECAP:
      return t('auth.buttons.recap');
    default:
      return t('auth.buttons.continue');
  }
}

export default function AuthScreen() {
  const { t, i18n } = useTranslation();
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
  const momentId = momentIndex !== null ? MOMENT_IDS[momentIndex] : null;

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
      setError(t('auth.errors.missingCredentials'));
      return;
    }
    setSubmitting(true);
    await savePendingOnboarding({
      firstName: firstName.trim(),
      baselineScore: score ?? 5,
      painId: pain?.id ?? '',
      obstacleIds: obstacleIndices.map((i) => OBSTACLE_IDS[i]),
      eventFrequencyId: frequencyIndex !== null ? EVENT_FREQUENCY_IDS[frequencyIndex] : '',
      rechargeId: rechargeIndex !== null ? RECHARGE_IDS[rechargeIndex] : '',
      anticipationId: anticipationIndex !== null ? ANTICIPATION_IDS[anticipationIndex] : '',
      momentId: momentId ?? '',
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
      painId: PAIN_TYPES[0].id,
      obstacleIds: [],
      eventFrequencyId: '',
      rechargeId: '',
      anticipationId: '',
      momentId: MOMENT_IDS[0],
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
      setError(t('auth.errors.missingCredentials'));
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
        await scheduleDailyReminder({ momentId: momentId ?? 'evening', batteryLevel: 0 });
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
              <Text style={styles.title}>{t('auth.signin.title')}</Text>
              <Text style={styles.tagline}>{t('auth.signin.tagline')}</Text>
            </View>

            <View style={styles.form}>
              <Field label={t('auth.fields.email')} value={email} onChangeText={setEmail} placeholder={t('auth.fields.emailPlaceholder')} keyboardType="email-address" />
              <Field label={t('auth.fields.password')} value={password} onChangeText={setPassword} placeholder={t('auth.fields.passwordPlaceholder')} secure />

              {error && <Text style={styles.error}>{error}</Text>}

              <PrimaryButton label={submitting ? t('auth.signin.submitting') : t('auth.signin.submit')} onPress={submitSignIn} disabled={submitting} />

              <Pressable onPress={() => setMode('quiz')} style={styles.switchMode}>
                <Text style={styles.switchModeText}>
                  {t('auth.signin.switchPrompt')} <Text style={styles.switchModeLink}>{t('auth.signin.switchLink')}</Text>
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
            <Text style={styles.title}>{t('auth.checkEmail.title')}</Text>
            <Text style={styles.tagline}>{t('auth.checkEmail.body', { email })}</Text>
          </View>
          <PrimaryButton label={t('common.signIn')} onPress={() => setMode('signin')} />
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

  const painLabel = (id: string) => t(`data.painTypes.${id}`);
  const obstacleLabel = (id: string) => t(`data.obstacles.${id}`);
  const frequencyLabel = (id: string) => t(`data.eventFrequency.${id}`);
  const rechargeLabel = (id: string) => t(`data.recharge.${id}`);
  const anticipationLabel = (id: string) => t(`data.anticipation.${id}`);
  const momentLabel = (id: string) => t(`data.moments.${id}`);

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
              <Text style={styles.title}>{t('auth.hook.title')}</Text>
              <Text style={styles.tagline}>{t('auth.hook.tagline1')}</Text>
              <Text style={styles.tagline}>{t('auth.hook.tagline2')}</Text>
            </View>
          )}

          {step === STEP.NAME && (
            <View style={styles.question}>
              <IllustrationBadge icon={<UserIcon color={colors.violet} size={36} />} accent={colors.violet} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.name.title')}</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('auth.name.placeholder')}
                placeholderTextColor={colors.textFaint}
                style={[styles.input, { marginTop: spacing[5] }]}
                autoFocus
              />
            </View>
          )}

          {step === STEP.DIAGNOSTIC && (
            <View style={styles.question}>
              <IllustrationBadge icon={<BoltIcon color={colors.coral} size={36} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.diagnostic.title', { name: firstName })}</Text>
              <View style={styles.slider}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Pressable key={n} onPress={() => setScore(n)} style={styles.sliderStep} hitSlop={4}>
                    <View style={[styles.sliderFill, score !== null && n > score && styles.sliderFillOff]} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                <Text style={styles.sliderLabel}>{t('auth.diagnostic.low')}</Text>
                {score !== null && <Text style={styles.sliderValue}>{score}</Text>}
                <Text style={styles.sliderLabel}>{t('auth.diagnostic.high')}</Text>
              </View>
            </View>
          )}

          {step === STEP.PAIN && (
            <View style={styles.question}>
              <IllustrationBadge icon={<MoonIcon color={colors.violetSoft} size={36} />} accent={colors.violetSoft} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.pain.title', { name: firstName })}</Text>
              <ChoiceList options={PAIN_TYPES.map((p) => painLabel(p.id))} selected={painIndex !== null ? [painIndex] : []} onToggle={setPainIndex} />
            </View>
          )}

          {step === STEP.OBSTACLE && (
            <View style={styles.question}>
              <IllustrationBadge icon={<LockIcon color={colors.violet} size={36} />} accent={colors.violet} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.obstacle.title')}</Text>
              <Text style={styles.questionSubtitle}>{t('auth.obstacle.subtitle')}</Text>
              <ChoiceList options={OBSTACLE_IDS.map(obstacleLabel)} selected={obstacleIndices} onToggle={toggleObstacle} multi square />
            </View>
          )}

          {step === STEP.FREQUENCY && (
            <View style={styles.question}>
              <IllustrationBadge icon={<CalendarIcon color={colors.lime} size={36} />} accent={colors.lime} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.frequency.title', { name: firstName })}</Text>
              <ChoiceList
                options={EVENT_FREQUENCY_IDS.map(frequencyLabel)}
                selected={frequencyIndex !== null ? [frequencyIndex] : []}
                onToggle={setFrequencyIndex}
              />
            </View>
          )}

          {step === STEP.RECHARGE && (
            <View style={styles.question}>
              <IllustrationBadge icon={<SunIcon color={colors.lime} size={36} />} accent={colors.lime} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.recharge.title')}</Text>
              <ChoiceList options={RECHARGE_IDS.map(rechargeLabel)} selected={rechargeIndex !== null ? [rechargeIndex] : []} onToggle={setRechargeIndex} />
            </View>
          )}

          {step === STEP.ANTICIPATION && (
            <View style={styles.question}>
              <IllustrationBadge icon={<ChevronRightIcon color={colors.coral} size={36} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.anticipation.title1')}</Text>
              <Text style={styles.questionTitle}>{t('auth.anticipation.title2')}</Text>
              <ChoiceList
                options={ANTICIPATION_IDS.map(anticipationLabel)}
                selected={anticipationIndex !== null ? [anticipationIndex] : []}
                onToggle={setAnticipationIndex}
              />
            </View>
          )}

          {step === STEP.MOMENT && (
            <View style={styles.question}>
              <IllustrationBadge icon={<MoonIcon color={colors.violetSoft} size={36} />} accent={colors.violetSoft} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.moment.title')}</Text>
              <ChoiceList options={MOMENT_IDS.map(momentLabel)} selected={momentIndex !== null ? [momentIndex] : []} onToggle={setMomentIndex} />
            </View>
          )}

          {step === STEP.AUTHORITY && (
            <View style={styles.hero}>
              <Text style={styles.brandWordBig}>{t('auth.authority.brand')}</Text>
              <Text style={styles.title}>{t('auth.authority.title')}</Text>
              <Text style={styles.tagline}>{t('auth.authority.tagline1')}</Text>
              <Text style={styles.tagline}>{t('auth.authority.tagline2')}</Text>
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
              <Text style={styles.notifHeroTitle}>{t('auth.notifications.title')}</Text>
              <Text style={styles.tagline}>{t('auth.notifications.tagline')}</Text>
              <NotificationMock momentId={momentId ?? 'evening'} />
            </View>
          )}

          {step === STEP.UNIQUE && (
            <View style={styles.hero}>
              <IllustrationBadge icon={<StarIcon color={colors.coral} size={34} />} accent={colors.coral} size={92} />
              <Text style={styles.title}>{firstName ? t('auth.unique.titleNamed', { name: firstName }) : t('auth.unique.titleGeneric')}</Text>
              <Text style={styles.tagline}>{t('auth.unique.tagline')}</Text>
            </View>
          )}

          {step === STEP.CONTRACT && (
            <View style={styles.question}>
              <IllustrationBadge icon={<HeartIcon color={colors.coral} size={34} />} accent={colors.coral} />
              <Text style={[styles.questionTitle, styles.withIllustration]}>{t('auth.contract.title')}</Text>
              <View style={styles.commitments}>
                {[t('auth.contract.commitment1'), t('auth.contract.commitment2'), t('auth.contract.commitment3')].map((c) => (
                  <Text key={c} style={styles.commitmentLine}>
                    · {c}
                  </Text>
                ))}
              </View>
              <Text style={styles.signLabel}>{t('auth.contract.signLabel')}</Text>
              <SignaturePad onChange={setSignatureGiven} />
              {signatureGiven && (
                <View style={styles.signedRow}>
                  <CheckIcon color={colors.lime} size={16} />
                  <Text style={styles.signedText}>{t('auth.contract.signed')}</Text>
                </View>
              )}
            </View>
          )}

          {step === STEP.RECAP && (
            <View style={[styles.hero, styles.recapHero]}>
              <Text style={styles.recapHeading}>{t('auth.recap.heading')}</Text>
              <View style={styles.recapLines}>
                <Text style={styles.recapBig}>
                  <Trans
                    i18nKey="auth.recap.painLine"
                    values={{ pain: pain ? painLabel(pain.id).toLowerCase() : '…' }}
                    components={{ hl: <Text style={styles.recapHlCoral} /> }}
                  />
                </Text>
                <Text style={styles.recapBig}>
                  <Trans
                    i18nKey="auth.recap.frequencyLine"
                    values={{
                      frequency: frequencyIndex !== null ? frequencyLabel(EVENT_FREQUENCY_IDS[frequencyIndex]).toLowerCase() : '…',
                      moment: momentId ? momentLabel(momentId).toLowerCase() : '…',
                    }}
                    components={{ hl1: <Text style={styles.recapHlViolet} /> }}
                  />
                </Text>
                <Text style={styles.recapBig}>
                  <Trans
                    i18nKey="auth.recap.rechargeLine"
                    values={{ recharge: rechargeIndex !== null ? rechargeLabel(RECHARGE_IDS[rechargeIndex]).toLowerCase() : '…' }}
                    components={{ hl2: <Text style={styles.recapHlLime} /> }}
                  />
                </Text>
              </View>
            </View>
          )}

          {step === STEP.TRIAL && (
            <View style={styles.trial}>
              <Text style={styles.eyebrow}>{t('auth.trial.eyebrow')}</Text>
              <View style={styles.timeline}>
                {[
                  { day: t('auth.trial.todayDay'), text: t('auth.trial.todayText'), icon: 'bolt' as const },
                  { day: t('auth.trial.reminderDay', { day: TRIAL_DAYS - 2 }), text: t('auth.trial.reminderText'), icon: 'bell' as const },
                  { day: t('auth.trial.chargeDay', { day: TRIAL_DAYS }), text: t('auth.trial.chargeText'), icon: 'check' as const },
                ].map((row, i, arr) => (
                  <View key={row.day} style={styles.timelineRow}>
                    <View style={styles.timelineIconCol}>
                      <View style={styles.timelineIcon}>
                        <TimelineIcon kind={row.icon} />
                      </View>
                      {i < arr.length - 1 && <View style={styles.timelineConnector} />}
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
                  const display = getPlanDisplay(plan, t, i18n.language);
                  const isSelected = plan.id === selectedPlan;
                  return (
                    <Pressable key={plan.id} onPress={() => setSelectedPlan(plan.id)} style={[styles.planCard, isSelected && styles.planCardSelected]}>
                      <View style={styles.trialBadge}>
                        <Text style={styles.trialBadgeText}>{t('auth.trial.offerBadge', { days: TRIAL_DAYS })}</Text>
                      </View>
                      <View style={styles.planRow}>
                        <View style={[styles.radio, isSelected && styles.radioSelected]} />
                        <Text style={styles.planName}>{display.name}</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.planPrice}>
                          {display.perMonth}
                          <Text style={styles.planPriceUnit}> {t('auth.trial.perMonth')}</Text>
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.footnote}>{getTrialRenewalText(selectedPlan, t, i18n.language)}</Text>
            </View>
          )}

          {step === STEP.SIGNUP && (
            <View style={styles.form}>
              <Text style={styles.questionTitle}>{t('auth.signup.title')}</Text>
              <Field label={t('auth.fields.email')} value={email} onChangeText={setEmail} placeholder={t('auth.fields.emailPlaceholder')} keyboardType="email-address" />
              <Field label={t('auth.fields.password')} value={password} onChangeText={setPassword} placeholder={t('auth.fields.passwordPlaceholder')} secure />
              {error && <Text style={styles.error}>{error}</Text>}
              <Text style={styles.consent}>
                <Trans
                  i18nKey="auth.signup.consent"
                  components={{
                    terms: <Text style={styles.consentLink} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)} />,
                    privacy: <Text style={styles.consentLink} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />,
                  }}
                />
              </Text>
            </View>
          )}
        </View>

        {__DEV__ && (
          <Pressable onPress={devQuickSignUp} disabled={submitting} style={styles.devBtn}>
            <Text style={styles.devBtnText}>{t('auth.dev.button')}</Text>
          </Pressable>
        )}

        {step === STEP.NOTIFICATIONS ? (
          <View style={styles.footer}>
            <Pressable style={{ flex: 1 }} onPress={requestNotifications}>
              <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>{t('auth.notifications.allow')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : step === STEP.TRIAL ? (
          <View style={styles.footer}>
            <Pressable style={{ flex: 1 }} onPress={() => setStep((s) => s + 1)}>
              <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>{t('auth.trial.start')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            {step === STEP.HOOK ? (
              <Pressable onPress={() => setMode('signin')} style={styles.skipBtn} hitSlop={10}>
                <Text style={styles.skipText}>{t('common.signIn')}</Text>
              </Pressable>
            ) : (
              step < STEP.SIGNUP && (
                <Pressable onPress={() => setStep((s) => s - 1)} style={styles.skipBtn} hitSlop={10}>
                  <Text style={styles.skipText}>{t('common.previous')}</Text>
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
                <Text style={styles.nextBtnText}>{nextButtonLabel(step, submitting, firstName, t)}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
        {isCustomFooterStep && (
          <Pressable onPress={() => setStep((s) => s + 1)} style={styles.notifSkip} hitSlop={10}>
            <Text style={styles.skipText}>{t('common.later')}</Text>
          </Pressable>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TimelineIcon({ kind }: { kind: 'bolt' | 'bell' | 'check' }) {
  if (kind === 'bolt') return <BoltIcon color={colors.lime} size={22} />;
  if (kind === 'bell') return <BellIcon color={colors.violetSoft} size={22} />;
  return <CheckIcon color={colors.coral} size={22} />;
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
  const { t } = useTranslation();
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
      <Text style={styles.title}>{lit ? t('auth.streak.titleAfter') : t('auth.streak.titleBefore')}</Text>
      <Text style={styles.tagline}>{lit ? t('auth.streak.taglineAfter') : t('auth.streak.taglineBefore')}</Text>
    </View>
  );
}

// Mimics a real iOS push notification (app icon, bold app name, timestamp,
// title, body) in the app's own palette, instead of describing what a
// notification looks like. The body uses the answer just given on the
// MOMENT step so it reads as personalized, and is written to make tapping
// it feel worth it rather than just informative.
function NotificationMock({ momentId }: { momentId: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.notifCard}>
      <View style={styles.notifCardHeader}>
        <View style={styles.notifCardIcon}>
          <LogoMark size={20} />
        </View>
        <Text style={styles.notifCardApp}>{t('auth.notifications.mockApp')}</Text>
        <Text style={styles.notifCardTime}>{t('auth.notifications.mockTime')}</Text>
      </View>
      <Text style={styles.notifCardTitle}>{t('auth.notifications.mockTitle')}</Text>
      <Text style={styles.notifCardBody}>{t('auth.notifications.mockBody', { moment: t(`data.moments.${momentId}`).toLowerCase() })}</Text>
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

  recapHero: { marginTop: -spacing[6] },
  recapHeading: { fontFamily: fontFamily.displayBold, fontSize: 36, color: colors.coral, textAlign: 'center', lineHeight: 42 },
  recapLines: { gap: spacing[4], marginTop: spacing[4] },
  recapBig: { fontFamily: fontFamily.textSemiBold, fontSize: 23, color: colors.textDim, textAlign: 'center', lineHeight: 30 },
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
