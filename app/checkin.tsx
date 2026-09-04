import { LinearGradient } from 'expo-linear-gradient';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsEvent } from '@/lib/analytics';
import { CloseIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { startOfToday, toDateKey } from '@/lib/battery';
import { submitCheckIn } from '@/lib/checkins';
import { longLocalDate } from '@/lib/dates';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

// Upsert semantics make this screen double as both "note ta journée" and
// "modifier la note d'aujourd'hui" — same form, prefilled if a check-in for
// today already exists, submit always overwrites rather than erroring.
export default function CheckInScreen() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { session } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    supabase
      .from('daily_checkins')
      .select('score, comment')
      .eq('day', toDateKey(startOfToday()))
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setScore(data.score);
          setComment(data.comment ?? '');
        }
        setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const submit = async () => {
    if (score === null || !session) return;
    setSubmitting(true);
    setError(null);
    const { error: submitError } = await submitCheckIn(session.user.id, score, comment);
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    posthog.capture(AnalyticsEvent.CheckinCompleted, { score, has_comment: comment.trim().length > 0 });
    safeBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.row}>
            <View>
              <Text style={styles.sub}>{longLocalDate(startOfToday())}</Text>
              <Text style={styles.h1}>{t('checkin.title')}</Text>
            </View>
            <Pressable onPress={() => safeBack()} hitSlop={10}>
              <CloseIcon color={colors.textDim} size={26} />
            </Pressable>
          </View>

          <View>
            <View style={styles.sliderTrack}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Pressable key={n} onPress={() => setScore(n)} style={styles.sliderStep} hitSlop={4}>
                  <View style={[styles.sliderFill, score !== null && n > score && styles.sliderFillOff]} />
                </Pressable>
              ))}
            </View>
            <View style={styles.row}>
              <Text style={styles.sliderLabel}>{t('checkin.low')}</Text>
              {score !== null && <Text style={styles.sliderValue}>{score}</Text>}
              <Text style={styles.sliderLabel}>{t('checkin.high')}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.sectionLabel}>{t('checkin.commentLabel')}</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('checkin.commentPlaceholder')}
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={4}
              style={styles.textarea}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={submitting || score === null || loadingExisting}>
            <LinearGradient
              colors={chargeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, (submitting || score === null) && styles.btnDisabled]}
            >
              <Text style={styles.submitText}>{submitting ? t('checkin.submitting') : t('checkin.submit')}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[7], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text, marginTop: 2, maxWidth: 260 },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  sliderTrack: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 10 },
  sliderStep: { flex: 1, height: 14 },
  sliderFill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.violetSoft },
  sliderFillOff: { backgroundColor: colors.borderSoft },
  sliderLabel: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  sliderValue: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral },

  textarea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: fontFamily.textMedium,
    fontSize: 15,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  error: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.critical },

  submitBtn: { borderRadius: radii.md, paddingVertical: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen, textAlign: 'center' },
});
