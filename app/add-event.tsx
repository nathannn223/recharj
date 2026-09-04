import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsEvent } from '@/lib/analytics';
import { BoltIcon, CalendarIcon, CloseIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fromDateKey, toDateKey } from '@/lib/battery';
import { longLocalDate } from '@/lib/dates';
import { EVENT_TYPE_IDS, tagsForEventType } from '@/lib/eventTags';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { useEvents } from '@/hooks/useEvents';

type Recommendation = { id: string; title: string };

export default function AddEventScreen() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { session } = useAuth();
  // Editing reuses this screen rather than duplicating a near-identical form:
  // the fields, the validation and the difficulty scale are the same, so a
  // route param is cheaper than a second screen to keep in sync.
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const isEditing = !!eventId;
  const { events, addEvent, updateEvent } = useEvents();

  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState(EVENT_TYPE_IDS[0]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [difficulty, setDifficulty] = useState(7);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [eventTypeForRec, setEventTypeForRec] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // useEvents() resolves asynchronously, so the row being edited isn't there
  // on first render. Fill the form once it arrives, and only once — after
  // that the user's own edits own the state.
  useEffect(() => {
    if (!isEditing || prefilled) return;
    const existing = events.find((e) => e.id === eventId);
    if (!existing) return;
    setTitle(existing.title ?? '');
    setSelectedType(EVENT_TYPE_IDS.includes(existing.type) ? existing.type : EVENT_TYPE_IDS[EVENT_TYPE_IDS.length - 1]);
    setDate(fromDateKey(existing.eventDate));
    setDifficulty(existing.difficulty);
    setDescription(existing.description ?? '');
    setPrefilled(true);
  }, [isEditing, prefilled, events, eventId]);

  const canPickType = title.trim().length > 0;
  const waitingForEvent = isEditing && !prefilled;

  function submitLabel(): string {
    if (waitingForEvent) return t('addEvent.loading');
    if (isEditing) return submitting ? t('addEvent.submitSaving') : t('addEvent.submitEdit');
    return submitting ? t('addEvent.submitAdding') : t('addEvent.submitAdd');
  }

  const submit = async () => {
    if (!canPickType) {
      setError(t('addEvent.errorNoTitle'));
      return;
    }
    setError(null);
    setSubmitting(true);

    const input = {
      title,
      type: selectedType,
      eventDate: toDateKey(date),
      difficulty,
      description,
    };

    // Narrowing on `eventId` itself rather than on `isEditing`: it does not
    // depend on TypeScript's aliased-condition analysis holding for whatever
    // shape useLocalSearchParams() returns.
    if (eventId) {
      const { error: updateError } = await updateEvent(eventId, input);
      setSubmitting(false);
      if (updateError) {
        setError(updateError);
        return;
      }
      posthog.capture(AnalyticsEvent.EventUpdated, { difficulty, event_type: selectedType });
      // No course recommendation on edit: replaying that screen every time a
      // difficulty is corrected would be intrusive. Recommending stays a
      // moment of creation.
      safeBack();
      return;
    }

    const { error: submitError } = await addEvent(input);
    if (submitError) {
      setSubmitting(false);
      setError(submitError);
      return;
    }
    posthog.capture(AnalyticsEvent.EventAdded, { difficulty, event_type: selectedType });

    // A matching course is suggested when the event is marked difficult
    // (see the helper text under the slider), but never one already
    // finished — no point recommending what the user already knows.
    let match: Recommendation | null = null;
    const tags = difficulty >= 7 ? tagsForEventType(selectedType) : [];
    if (tags.length && session) {
      const [{ data: candidates }, { data: progressRows }] = await Promise.all([
        supabase.from('courses').select('id, title').contains('tags', tags).order('order_index', { ascending: true }),
        supabase.from('course_progress').select('course_id').eq('status', 'completed'),
      ]);
      const completedIds = new Set((progressRows ?? []).map((p) => p.course_id as string));
      match = ((candidates ?? []) as Recommendation[]).find((c) => !completedIds.has(c.id)) ?? null;
    }

    setSubmitting(false);
    if (match) {
      setEventTypeForRec(selectedType);
      setRecommendation(match);
    } else {
      safeBack();
    }
  };

  if (recommendation) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.recContent}>
          <View style={styles.recBadge}>
            <BoltIcon color={colors.surfaceScreen} size={22} />
          </View>
          <Text style={styles.recTitle}>{recommendation.title}</Text>
          <Text style={styles.recNote}>{t('addEvent.recommendation.note', { type: t(`data.eventTypes.${eventTypeForRec}`) })}</Text>

          <View style={{ gap: spacing[3], width: '100%', marginTop: spacing[6] }}>
            <Pressable onPress={() => router.replace(`/course/${recommendation.id}?from=event_recommendation`)}>
              <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                <Text style={styles.submitText}>{t('addEvent.recommendation.viewCourse')}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => safeBack()} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t('addEvent.recommendation.skip')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>{isEditing ? t('addEvent.titleEdit') : t('addEvent.titleNew')}</Text>
          <Pressable onPress={() => safeBack()} hitSlop={10}>
            <CloseIcon color={colors.textDim} size={26} />
          </Pressable>
        </View>

        <View>
          <Text style={styles.sectionLabel}>{t('addEvent.titleLabel')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('addEvent.titlePlaceholder')}
            placeholderTextColor={colors.textFaint}
            style={styles.titleInput}
          />
        </View>

        <View pointerEvents={canPickType ? 'auto' : 'none'} style={!canPickType && { opacity: 0.4 }}>
          <Text style={styles.sectionLabel}>{t('addEvent.typeLabel')}</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPE_IDS.map((typeId) => {
              const selected = typeId === selectedType;
              return (
                <Pressable key={typeId} onPress={() => setSelectedType(typeId)} style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(`data.eventTypes.${typeId}`)}</Text>
                </Pressable>
              );
            })}
          </View>
          {!canPickType && <Text style={styles.helper}>{t('addEvent.typeHelper')}</Text>}
        </View>

        <View>
          <Text style={styles.sectionLabel}>{t('addEvent.dateLabel')}</Text>
          <Pressable style={styles.field} onPress={() => setShowPicker((v) => !v)}>
            <Text style={styles.fieldText}>{longLocalDate(date)}</Text>
            <CalendarIcon color={colors.textDim} size={20} />
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              // An event being corrected may legitimately sit in the past;
              // a new one may not.
              minimumDate={isEditing ? undefined : new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (event.type === 'set' && selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <View>
          <Text style={styles.sectionLabel}>{t('addEvent.descriptionLabel')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('addEvent.descriptionPlaceholder')}
            placeholderTextColor={colors.textFaint}
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
        </View>

        <View>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>{t('addEvent.difficultyLabel')}</Text>
            <Text style={styles.diffValue}>{difficulty}/10</Text>
          </View>
          <View style={styles.sliderTrack}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable key={n} onPress={() => setDifficulty(n)} style={styles.sliderStep} hitSlop={4}>
                <View style={[styles.sliderFill, n > difficulty && styles.sliderFillOff]} />
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={styles.sliderLabel}>{t('addEvent.difficultyLow')}</Text>
            <Text style={styles.sliderLabel}>{t('addEvent.difficultyHigh')}</Text>
          </View>
          {!isEditing && <Text style={styles.helper}>{t('addEvent.difficultyHelper')}</Text>}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={submit} disabled={submitting || !canPickType || waitingForEvent}>
          <LinearGradient
            colors={chargeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitBtn, (submitting || !canPickType || waitingForEvent) && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>{submitLabel()}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[7], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 27, color: colors.text },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 16 },
  chipSelected: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim },
  chipTextSelected: { color: colors.text },

  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.text },

  titleInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontFamily: fontFamily.textMedium,
    fontSize: 16,
    color: colors.text,
  },

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
    minHeight: 80,
    textAlignVertical: 'top',
  },

  diffValue: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral, marginBottom: 8 },
  sliderTrack: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 10 },
  sliderStep: { flex: 1, height: 14 },
  sliderFill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.coral },
  sliderFillOff: { backgroundColor: colors.borderSoft },
  sliderLabel: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  helper: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 12, lineHeight: 20 },

  error: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.critical },

  submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },

  recContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  recBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, textAlign: 'center', marginTop: spacing[4] },
  recNote: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 6, textAlign: 'center' },

  skipBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  skipText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textFaint },
});
