import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { PAIN_TYPES } from '@/lib/painTypes';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';

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

const STEP = { HOOK: 0, DIAGNOSTIC: 1, PAIN: 2, NAME: 3, PROMISE: 4, SIGNUP: 5, CHECK_EMAIL: 6 } as const;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('quiz');
  const [step, setStep] = useState<number>(STEP.HOOK);

  const [score, setScore] = useState<number | null>(null);
  const [painIndex, setPainIndex] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pain = painIndex !== null ? PAIN_TYPES[painIndex] : null;

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
    });
    const { error: signUpError, hasSession } = await signUp(email, password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
    } else if (!hasSession) {
      setStep(STEP.CHECK_EMAIL);
    }
    // If a session came back immediately, RootNavigator picks it up and
    // routes into app/onboarding.tsx on its own — nothing else to do here.
  };

  // Dev-only: generates a fresh, guaranteed-unique test account and runs it
  // through the exact same signUp() path as a real user — Supabase still
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
    await savePendingOnboarding({ firstName: 'Dev', baselineScore: 5, painType: PAIN_TYPES[0].label });
    const { error: signUpError, hasSession } = await signUp(testEmail, testPassword);
    setSubmitting(false);
    if (signUpError) setError(signUpError);
    else if (!hasSession) setStep(STEP.CHECK_EMAIL);
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
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
    );
  }

  // --- quiz mode ---

  if (step === STEP.CHECK_EMAIL) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <LogoMark />
            <Text style={styles.title}>Vérifie ta boîte mail</Text>
            <Text style={styles.tagline}>
              On t'a envoyé un lien de confirmation à {email}. Reviens ici et connecte-toi une fois ton compte confirmé.
            </Text>
          </View>
          <PrimaryButton label="Se connecter" onPress={() => setMode('signin')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {step > STEP.HOOK && (
          <View style={styles.dots}>
            {[STEP.DIAGNOSTIC, STEP.PAIN, STEP.NAME, STEP.PROMISE, STEP.SIGNUP].map((s) => (
              <View key={s} style={[styles.dot, s <= step && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {step === STEP.HOOK && (
            <View style={styles.hero}>
              <LogoMark />
              <Text style={styles.title}>Les sorties te vident plus vite que les autres ?</Text>
              <Text style={styles.tagline}>
                Tu n'es pas seul. Recharj t'aide à voir venir la fatigue sociale avant qu'elle arrive — et à progresser, un peu
                chaque jour.
              </Text>
            </View>
          )}

          {step === STEP.DIAGNOSTIC && (
            <View style={styles.question}>
              <Text style={styles.questionTitle}>À quel point te sens-tu à l'aise dans les situations sociales aujourd'hui ?</Text>
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
              <Text style={styles.questionTitle}>Qu'est-ce qui te vide le plus ?</Text>
              <View style={{ gap: spacing[3], marginTop: spacing[5] }}>
                {PAIN_TYPES.map((p, i) => {
                  const selected = painIndex === i;
                  return (
                    <Pressable key={p.label} onPress={() => setPainIndex(i)} style={[styles.choice, selected && styles.choiceSelected]}>
                      <View style={[styles.bullet, selected && styles.bulletSelected]} />
                      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
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

          {step === STEP.PROMISE && (
            <View style={styles.hero}>
              <Text style={styles.title}>
                {firstName || 'Toi'}, tu n'es pas seul{firstName ? '·e' : ''}.
              </Text>
              <Text style={styles.tagline}>
                {score !== null && score <= 4
                  ? "Beaucoup de gens qui utilisent Recharj partent d'un niveau de confort similaire au tien. "
                  : ''}
                Avec un peu de pratique régulière, la plupart progressent nettement sur ce qui les draine le plus
                {pain ? ` — ${pain.label.toLowerCase()}` : ''}.
              </Text>
            </View>
          )}

          {step === STEP.SIGNUP && (
            <View style={styles.form}>
              <Text style={styles.questionTitle}>Crée ton compte pour commencer</Text>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="toi@exemple.com" keyboardType="email-address" />
              <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          )}
        </View>

        {__DEV__ && (
          <Pressable onPress={devQuickSignUp} disabled={submitting} style={styles.devBtn}>
            <Text style={styles.devBtnText}>⚡ DEV — Compte de test instantané</Text>
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
            disabled={
              submitting ||
              (step === STEP.DIAGNOSTIC && score === null) ||
              (step === STEP.PAIN && painIndex === null) ||
              (step === STEP.NAME && !firstName.trim())
            }
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
              style={[
                styles.nextBtn,
                (submitting ||
                  (step === STEP.DIAGNOSTIC && score === null) ||
                  (step === STEP.PAIN && painIndex === null) ||
                  (step === STEP.NAME && !firstName.trim())) &&
                  styles.btnDisabled,
              ]}
            >
              <Text style={styles.nextBtnText}>
                {step === STEP.HOOK
                  ? 'Commencer'
                  : step === STEP.PROMISE
                    ? 'Voir comment'
                    : step === STEP.SIGNUP
                      ? submitting
                        ? 'Un instant…'
                        : 'Créer mon compte'
                      : 'Continuer'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  centered: { justifyContent: 'center' },
  content: { flex: 1, padding: spacing[6], paddingTop: spacing[7], paddingBottom: spacing[6], gap: spacing[4] },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.lime },

  body: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing[3] },
  title: { fontFamily: fontFamily.displayBold, fontSize: 28, color: colors.text, textAlign: 'center', lineHeight: 34 },
  tagline: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, textAlign: 'center', lineHeight: 23, maxWidth: 320 },

  question: {},
  questionTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, lineHeight: 28 },

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
  bulletSelected: { borderColor: colors.violet, backgroundColor: colors.violet },
  choiceText: { flex: 1, fontFamily: fontFamily.textMedium, fontSize: 15, color: colors.textDim },
  choiceTextSelected: { color: colors.text },

  form: { gap: spacing[4] },
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
