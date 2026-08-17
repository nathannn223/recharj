import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CloseIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { SourceRow } from '@/lib/courses';
import { supabase } from '@/lib/supabase';

export default function SourceScreen() {
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
        if (fetchError || !data) setError(fetchError?.message ?? 'Source introuvable.');
        else setSource(data as SourceRow);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Approfondir ce sujet</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
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
                {source.is_scientific ? 'Scientifique' : 'Non scientifique'}
              </Text>
            </View>
            {!source.is_scientific && (
              <Text style={styles.disclaimer}>
                Recommandation d'expert reconnu — ne s'appuie pas sur une étude académique publiée.
              </Text>
            )}

            <View>
              <Text style={styles.studyTitle}>{source.study_title}</Text>
              <Text style={styles.meta}>
                {source.authors}
                {source.year ? ` · ${source.year}` : ''}
                {source.journal_or_publisher ? ` · ${source.journal_or_publisher}` : ''}
              </Text>
            </View>

            <Text style={styles.summary}>{source.summary}</Text>

            <Pressable style={styles.readBtn} onPress={() => WebBrowser.openBrowserAsync(source.external_url)}>
              <Text style={styles.readBtnText}>Lire l'étude</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[4], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text },
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
