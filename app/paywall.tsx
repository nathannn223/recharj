import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsEvent } from '@/lib/analytics';
import { CheckIcon, CloseIcon, LockIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import { safeBack } from '@/lib/navigation';
import { localizedCourseContent, localizedCourseTitle } from '@/lib/courses';
import { getPlanDisplay, getTrialRenewalText, PLANS, TRIAL_DAYS, type Plan } from '@/lib/plans';
import { supabase } from '@/lib/supabase';

type CoursePreview = { title: string; hook: string };

export default function PaywallScreen() {
  const { t, i18n } = useTranslation();
  const posthog = usePostHog();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [preview, setPreview] = useState<CoursePreview | null>(null);

  const PERKS = [t('paywall.perks.fullLibrary'), t('paywall.perks.unlimitedProjection'), t('paywall.perks.linkedCourses')];

  useEffect(() => {
    posthog.capture(AnalyticsEvent.PaywallViewed, { source: courseId ? 'course_gate' : 'library_banner', course_id: courseId ?? null });
    // Fires once per mount only — re-firing on every courseId/i18n.language
    // change (this effect's own deps further down already react to those
    // for the preview fetch) would count one paywall visit as several views.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: wire to RevenueCat's restorePurchases() once the App Store /
  // RevenueCat accounts exist and real in-app purchases are live — this is
  // currently a stub so the required button is present ahead of that work.
  const restorePurchases = () => {
    posthog.capture(AnalyticsEvent.RestorePurchasesTapped);
    Alert.alert(t('paywall.restoreAlert.title'), t('paywall.restoreAlert.body'));
  };

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    supabase
      .from('courses')
      .select('title, title_en, content, content_en')
      .eq('id', courseId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setPreview({ title: localizedCourseTitle(data, i18n.language), hook: localizedCourseContent(data, i18n.language).hook });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, i18n.language]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>{preview ? t('paywall.titleCourse') : t('paywall.titleGeneric')}</Text>
          <Pressable onPress={() => safeBack()} hitSlop={10}>
            <CloseIcon color={colors.textDim} size={26} />
          </Pressable>
        </View>

        {preview ? (
          <View style={styles.previewCard}>
            <View style={styles.previewBadge}>
              <LockIcon color={colors.surfaceScreen} size={18} />
            </View>
            <Text style={styles.previewEyebrow}>{t('paywall.preview.eyebrow')}</Text>
            <Text style={styles.previewTitle}>{preview.title}</Text>
            <Text style={styles.previewHook} numberOfLines={5}>
              {preview.hook}
            </Text>
            <Text style={styles.previewMore}>{t('paywall.preview.more')}</Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <CheckIcon color={colors.lime} size={14} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ gap: spacing[3], marginTop: 'auto' }}>
          <View style={{ gap: spacing[3] }}>
            {PLANS.map((plan) => {
              const display = getPlanDisplay(plan, t, i18n.language);
              const isSelected = plan.id === selected;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    setSelected(plan.id);
                    posthog.capture(AnalyticsEvent.PlanSelected, { plan_id: plan.id, source: 'paywall' });
                  }}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                >
                  {display.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{display.badge}</Text>
                    </View>
                  )}
                  <View style={styles.trialBadge}>
                    <Text style={styles.trialBadgeText}>{t('paywall.badge.trial', { days: TRIAL_DAYS })}</Text>
                  </View>
                  <View style={styles.planRow}>
                    <View style={[styles.radio, isSelected && styles.radioSelected]} />
                    <Text style={styles.planName}>{display.name}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.planPrice}>
                      {display.perMonth}
                      <Text style={styles.planPriceUnit}> {t('paywall.perMonth')}</Text>
                    </Text>
                  </View>
                  <Text style={[styles.planDetail, plan.id === 'monthly' && styles.planDetailWarning]}>
                    {display.strikeThrough && <Text style={styles.strikeThrough}>{display.strikeThrough} </Text>}
                    {display.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* TODO: this always offers the trial, because there's no
              purchase history yet to check against. Once RevenueCat is
              wired, gate this on trial eligibility so a user who already
              consumed their 7 days from the onboarding offer sees the
              regular renewal text instead. */}
          <Pressable
            onPress={() => {
              posthog.capture(AnalyticsEvent.PlanConfirmed, { plan_id: selected, source: 'paywall' });
              safeBack();
            }}
          >
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              <Text style={styles.submitText}>{preview ? t('paywall.submitCourse') : t('paywall.submitGeneric')}</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.footnote}>
            {getTrialRenewalText(selected, t, i18n.language)} {t('paywall.manageNote')}
          </Text>
          <View style={styles.legalRow}>
            <Pressable onPress={restorePurchases}>
              <Text style={styles.legalLink}>{t('paywall.restore')}</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
              <Text style={styles.legalLink}>{t('paywall.privacy')}</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
              <Text style={styles.legalLink}>{t('paywall.terms')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8], flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 27, color: colors.text },

  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim },

  previewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[5],
    gap: spacing[2],
  },
  previewBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  previewEyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing[2] },
  previewTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, color: colors.text, lineHeight: 26 },
  previewHook: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim, lineHeight: 22 },
  previewMore: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.violetSoft, marginTop: spacing[1] },

  planCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing[4],
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.coral,
    backgroundColor: 'rgba(255,122,107,0.06)',
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
  radioSelected: { borderColor: colors.coral, backgroundColor: colors.coral },
  badge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.surfaceScreen, letterSpacing: 0.4 },
  trialBadge: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 2 },
  trialBadgeText: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.surfaceScreen, letterSpacing: 0.3 },
  planName: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.text },
  planPrice: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, color: colors.text },
  planPriceUnit: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textDim },
  planDetail: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint, marginLeft: 30 },
  planDetailWarning: { color: colors.coral, fontFamily: fontFamily.textMedium },
  strikeThrough: { textDecorationLine: 'line-through', color: colors.textFaint },

  submitBtn: { borderRadius: radii.md, paddingVertical: 18, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen, textAlign: 'center' },
  footnote: { fontFamily: fontFamily.textRegular, fontSize: 12, color: colors.textFaint, textAlign: 'center', lineHeight: 17 },

  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  legalLink: { fontFamily: fontFamily.textMedium, fontSize: 12, color: colors.textFaint, textDecorationLine: 'underline' },
  legalDot: { fontFamily: fontFamily.textMedium, fontSize: 12, color: colors.textFaint },
});
