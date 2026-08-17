import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/lib/auth';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setSubmitting(true);
    const { error: authError } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (authError) setError(authError);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Svg width={64} height={64} viewBox="0 0 40 40">
            <Rect x={1} y={1} width={38} height={38} rx={12} fill="url(#mark)" />
            <Path d="M22 9 12 22h7l-1 9 11-14h-8z" fill={colors.ink} />
            <Defs>
              <SvgLinearGradient id="mark" x1="0" y1="0" x2="40" y2="40">
                <Stop offset="0" stopColor={colors.violet} />
                <Stop offset="0.55" stopColor={colors.coral} />
                <Stop offset="1" stopColor={colors.lime} />
              </SvgLinearGradient>
            </Defs>
          </Svg>
          <Text style={styles.title}>Recharj</Text>
          <Text style={styles.tagline}>Ta batterie sociale, sous contrôle.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="toi@exemple.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signIn' ? 'password' : 'password-new'}
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={submitting} style={{ marginTop: spacing[2] }}>
            <LinearGradient
              colors={chargeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Un instant…' : mode === 'signIn' ? 'Se connecter' : 'Créer mon compte'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} style={styles.switchMode}>
            <Text style={styles.switchModeText}>
              {mode === 'signIn' ? "Pas encore de compte ? " : 'Déjà un compte ? '}
              <Text style={styles.switchModeLink}>{mode === 'signIn' ? 'Créer un compte' : 'Se connecter'}</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1, justifyContent: 'center', padding: spacing[6], gap: spacing[7] },
  hero: { alignItems: 'center', gap: spacing[2] },
  title: { fontFamily: fontFamily.displayBold, fontSize: 30, color: colors.text, marginTop: spacing[2] },
  tagline: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim },

  form: { gap: spacing[4] },
  field: { gap: 8 },
  label: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },
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

  submitBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },

  switchMode: { alignItems: 'center', marginTop: spacing[1] },
  switchModeText: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint },
  switchModeLink: { color: colors.textDim, fontFamily: fontFamily.textSemiBold, textDecorationLine: 'underline' },
});
