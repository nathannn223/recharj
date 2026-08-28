import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoltIcon, CheckIcon, ChevronRightIcon, LockIcon, SearchIcon, StarIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { canAccessCourse, type CourseRow, type SubscriptionTier } from '@/lib/courses';
import { supabase } from '@/lib/supabase';

const FILTERS = ['Tous', 'Débuter', 'Travail', 'Famille'];

const FILTER_TAGS: Record<string, string | null> = {
  Tous: null,
  'Débuter': 'debuter',
  Travail: 'travail',
  Famille: 'famille',
};

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Gratuit',
  premium: 'Premium',
};

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

// Only what this screen's list and access checks touch — course/[id].tsx
// fetches the full CourseRow (content included) itself, once a course is
// actually opened.
type LibraryCourse = Pick<
  CourseRow,
  'id' | 'title' | 'order_index' | 'tags' | 'free_tier_included' | 'level' | 'parent_course_id' | 'required_tier'
>;

export default function LibraryScreen() {
  const { session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [freeCourseId, setFreeCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<LibraryCourse[]>([]);
  const [progress, setProgress] = useState<Map<string, ProgressStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      // free_course_id is fetched separately and treated as best-effort —
      // see the matching comment in app/course/[id].tsx.
      const [{ data: profile }, { data: freeCourseRow }, { data: courseRows }, { data: progressRows }] = await Promise.all([
        supabase.from('profiles').select('subscription_tier').single(),
        supabase.from('profiles').select('free_course_id').maybeSingle(),
        // Only what the list and its access checks need — the full `content`
        // JSONB (hook, cards, exercise) is course/[id].tsx's job, which
        // fetches it itself once a course is actually opened.
        supabase
          .from('courses')
          .select('id, title, order_index, tags, free_tier_included, level, parent_course_id, required_tier')
          .order('order_index', { ascending: true }),
        supabase.from('course_progress').select('course_id, status'),
      ]);
      if (cancelled) return;
      setTier((profile?.subscription_tier as SubscriptionTier) ?? 'free');
      setFreeCourseId((freeCourseRow?.free_course_id as string) ?? null);
      setCourses((courseRows as LibraryCourse[]) ?? []);
      setProgress(new Map((progressRows ?? []).map((p) => [p.course_id as string, p.status as ProgressStatus])));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const activeTag = FILTER_TAGS[activeFilter];
  const level1 = courses.filter((c) => c.level === 1 && (!activeTag || c.tags.includes(activeTag)));
  const level2ByParent = new Map(courses.filter((c) => c.level === 2).map((c) => [c.parent_course_id, c]));

  const openCourse = (course: LibraryCourse) => {
    if (!canAccessCourse(course, tier, freeCourseId)) {
      router.push({ pathname: '/paywall', params: { courseId: course.id } });
    } else {
      router.push(`/course/${course.id}`);
    }
  };

  const anyLocked = courses.some((c) => !canAccessCourse(c, tier, freeCourseId));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Bibliothèque</Text>
          <SearchIcon color={colors.textDim} size={24} />
        </View>

        {anyLocked && (
          <Pressable onPress={() => router.push('/paywall')}>
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeBanner}>
              <View>
                <Text style={styles.upgradeTitle}>Débloque tous les cours</Text>
                <Text style={styles.upgradeSub}>À partir de 2,92€/mois</Text>
              </View>
              <ChevronRightIcon color={colors.surfaceScreen} size={20} />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.chipRow}>
          {FILTERS.map((f) => {
            const selected = f === activeFilter;
            return (
              <Pressable key={f} onPress={() => setActiveFilter(f)} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.violetSoft} style={{ marginTop: spacing[6] }} />
        ) : level1.length === 0 ? (
          <Text style={styles.emptyText}>Aucun cours pour ce filtre.</Text>
        ) : (
          <View style={{ gap: spacing[3] }}>
            {level1.map((course) => {
              const locked = !canAccessCourse(course, tier, freeCourseId);
              const status = progress.get(course.id) ?? 'not_started';
              const level2 = level2ByParent.get(course.id);
              const level2Locked = level2 ? !canAccessCourse(level2, tier, freeCourseId) : false;

              return (
                <View key={course.id} style={{ gap: spacing[2] }}>
                  <CourseRowItem
                    title={course.title}
                    meta={locked ? TIER_LABEL[course.required_tier] : status === 'completed' ? 'Terminé' : status === 'in_progress' ? 'En cours' : '5-10 min'}
                    locked={locked}
                    status={status}
                    onPress={() => openCourse(course)}
                  />
                  {level2 && (
                    <View style={styles.level2Row}>
                      <Pressable
                        onPress={() => openCourse(level2)}
                        style={[styles.level2Inner, level2Locked && styles.libRowLocked]}
                      >
                        <View style={styles.level2Icon}>
                          <StarIcon color={colors.lime} size={13} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.level2Name}>{level2.title}</Text>
                          <Text style={styles.level2Meta}>
                            {level2Locked ? TIER_LABEL[level2.required_tier] : 'Approfondissement'}
                          </Text>
                        </View>
                        {level2Locked && <LockIcon color={colors.violetSoft} size={14} />}
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CourseRowItem({
  title,
  meta,
  locked,
  status,
  onPress,
}: {
  title: string;
  meta: string;
  locked: boolean;
  status: ProgressStatus;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.libRow, locked && styles.libRowLocked]}>
      <View style={styles.libIcon}>
        {locked ? (
          <LockIcon color={colors.violetSoft} size={18} />
        ) : status === 'completed' ? (
          <CheckIcon color={colors.violetSoft} size={18} />
        ) : (
          <BoltIcon color={colors.violetSoft} size={18} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.libName}>{title}</Text>
        <Text style={styles.libMeta}>{meta}</Text>
      </View>
      {!locked && status === 'completed' && <Text style={{ color: colors.lime, fontFamily: fontFamily.textBold, fontSize: 16 }}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 34, color: colors.text },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 16 },
  chipSelected: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim },
  chipTextSelected: { color: colors.text },

  emptyText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim },

  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  libRowLocked: { opacity: 0.55 },
  libIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  libName: { fontFamily: fontFamily.textSemiBold, fontSize: 16, color: colors.text },
  libMeta: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim, marginTop: 2 },

  level2Row: { paddingLeft: spacing[6] },
  level2Inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  level2Icon: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(232,255,94,0.14)', alignItems: 'center', justifyContent: 'center' },
  level2Name: { fontFamily: fontFamily.textSemiBold, fontSize: 13.5, color: colors.text },
  level2Meta: { fontFamily: fontFamily.textRegular, fontSize: 11.5, color: colors.textDim, marginTop: 1 },

  upgradeBanner: { borderRadius: 18, padding: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upgradeTitle: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  upgradeSub: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.surfaceScreen, opacity: 0.75, marginTop: 2 },
});
