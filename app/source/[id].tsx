import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import { localizedSource, type SourceRow } from '@/lib/courses';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

export default function SourceScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [source, setSource] = useState<SourceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError || !data) setError(fetchError?.message ?? t('source.notFound'));
        else setSource(data as SourceRow);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const localized = source ? localizedSource(source, i18n.language) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>{t('source.title')}</Text>
          <Pressable onPress={() => safeBack()} hitSlop={10}>
            <CloseIcon color={colors.textDim} size={26} />
          </Pressable>
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.violetSoft} />
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {source && (
          <>
            <View style={[styles.badge, source.is_scientific ? styles.badgeScientific : styles.badgeNeutral]}>
              <Text style={[styles.badgeText, source.is_scientific ? styles.badgeTextScientific : styles.badgeTextNeutral]}>
                {source.is_scientific ? t('source.scientific') : t('source.notScientific')}
              </Text>
            </View>
            {!source.is_scientific && <Text style={styles.disclaimer}>{t('source.expertDisclaimer')}</Text>}

            <View>
              <Text style={styles.studyTitle}>{localized!.study_title}</Text>
              <Text style={styles.meta}>
                {localized!.authors}
                {source.year ? ` · ${source.year}` : ''}
                {localized!.journal_or_publisher ? ` · ${localized!.journal_or_publisher}` : ''}
              </Text>
            </View>

            <Text style={styles.summary}>{localized!.summary}</Text>

            <Pressable style={styles.readBtn} onPress={() => WebBrowser.openBrowserAsync(source.external_url)}>
              <Text style={styles.readBtnText}>{t('source.readStudy')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[4], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 25, color: colors.text },
  centered: { paddingVertical: spacing[7], alignItems: 'center' },
  errorText: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.critical },

  badge: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 14 },
  badgeScientific: { backgroundColor: 'rgba(232,255,94,0.16)', borderWidth: 1, borderColor: 'rgba(232,255,94,0.4)' },
  badgeNeutral: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  badgeText: { fontFamily: fontFamily.textBold, fontSize: 12, letterSpacing: 0.4 },
  badgeTextScientific: { color: colors.lime },
  badgeTextNeutral: { color: colors.textDim },

  disclaimer: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint, lineHeight: 19, marginTop: -spacing[2] },

  studyTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, color: colors.text, lineHeight: 25 },
  meta: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textDim, marginTop: 4 },

  summary: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim, lineHeight: 23 },

  readBtn: { borderWidth: 1, borderColor: colors.violetSoft, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing[2] },
  readBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.violetSoft },
});
