import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BoltIcon, CheckIcon, ChevronLeftIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';

// Placeholder content for the first launch course, structured exactly per
// the brief's 4-step format. Once contenu-cours-mvp.md is ready this will
// come from Supabase (courses.content) keyed by the `id` route param
// instead of being hardcoded here.
const COURSE = {
  title: 'Gérer un silence gênant',
  hook: "Tu es à une pause café. La conversation s'arrête net. Tu sens le silence s'installer et tu ne sais pas quoi dire.",
  diagnostic: {
    question: 'Face à un silence, qu\'est-ce qui te met le plus mal à l\'aise ?',
    options: [
      'La peur du jugement',
      'La peur de dire une bêtise',
      "L'impression de devoir combler à tout prix",
      'Autre chose',
    ],
  },
  cards: [
    {
      title: "Le silence n'est pas un échec",
      body: "C'est souvent un espace que l'autre remplira lui-même si tu lui laisses deux secondes de plus que d'habitude.",
    },
    {
      title: 'Respire avant de parler',
      body: "Une respiration consciente casse l'envie de combler le vide par réflexe, et te laisse une seconde pour choisir tes mots.",
    },
    {
      title: 'Une question vaut mieux qu\'une blague',
      body: 'Rebondir avec une question ouverte relance la conversation sans mettre la pression sur ton humour.',
    },
  ],
  exercise: {
    prompt: "Ton collègue vient de raconter une blague qui tombe à plat. Le silence s'installe. Que fais-tu ?",
    choices: [
      { text: 'Tu ris pour combler le vide', correct: false },
      { text: 'Tu rebondis avec une question ouverte', correct: true },
      { text: 'Tu regardes ton téléphone', correct: false },
    ],
    feedback: "Bonne réponse — rebondir montre que tu écoutes, sans forcer l'humour.",
  },
};

const STEP_COUNT = 4;

export default function CourseScreen() {
  useLocalSearchParams<{ id: string }>();

  const [step, setStep] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [diagnosticChoice, setDiagnosticChoice] = useState<number | null>(null);
  const [exerciseChoice, setExerciseChoice] = useState<number | null>(null);

  const goBack = () => {
    if (step === 2 && cardIndex > 0) {
      setCardIndex((i) => i - 1);
    } else if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Pressable onPress={goBack} hitSlop={10}>
            <ChevronLeftIcon color={colors.textDim} size={24} />
          </Pressable>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {COURSE.title}
          </Text>
          <View style={styles.stepDots}>
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <View key={i} style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        {step === 0 && (
          <View style={styles.card}>
            <View style={styles.accentBolt}>
              <BoltIcon color={colors.surfaceScreen} size={20} />
            </View>
            <Text style={styles.eyebrow}>Mise en situation</Text>
            <Text style={styles.cardTitle}>{COURSE.hook}</Text>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.question}>{COURSE.diagnostic.question}</Text>
            <View style={{ gap: spacing[3], marginTop: spacing[4] }}>
              {COURSE.diagnostic.options.map((opt, i) => {
                const selected = diagnosticChoice === i;
                return (
                  <Pressable key={i} onPress={() => setDiagnosticChoice(i)} style={[styles.choice, selected && styles.choiceSelected]}>
                    <View style={[styles.bullet, selected && styles.bulletSelected]} />
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.accentBolt}>
              <BoltIcon color={colors.surfaceScreen} size={20} />
            </View>
            <Text style={styles.eyebrow}>
              Carte {cardIndex + 1}/{COURSE.cards.length}
            </Text>
            <Text style={styles.cardTitle}>{COURSE.cards[cardIndex].title}</Text>
            <Text style={styles.cardBody}>{COURSE.cards[cardIndex].body}</Text>
          </View>
        )}

        {step === 3 && (
          <View>
            <View style={styles.quizPrompt}>
              <Text style={styles.quizPromptText}>{COURSE.exercise.prompt}</Text>
            </View>
            <View style={{ gap: spacing[3], marginTop: spacing[4] }}>
              {COURSE.exercise.choices.map((c, i) => {
                const picked = exerciseChoice === i;
                const revealed = exerciseChoice !== null;
                const showCorrect = revealed && c.correct;
                return (
                  <Pressable
                    key={i}
                    disabled={revealed}
                    onPress={() => setExerciseChoice(i)}
                    style={[styles.choice, showCorrect && styles.choiceCorrect, picked && !c.correct && styles.choiceWrong]}
                  >
                    <View style={[styles.bullet, showCorrect && styles.bulletCorrect]}>
                      {showCorrect && <CheckIcon color={colors.surfaceScreen} size={12} />}
                    </View>
                    <Text style={[styles.choiceText, showCorrect && styles.choiceTextSelected]}>{c.text}</Text>
                  </Pressable>
                );
              })}
            </View>
            {exerciseChoice !== null && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackText}>{COURSE.exercise.feedback}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.navRow}>
          {step > 0 && (
            <Pressable style={styles.btnGhost} onPress={goBack}>
              <Text style={styles.btnGhostText}>Précédent</Text>
            </Pressable>
          )}
          <Pressable
            style={{ flex: 1 }}
            disabled={(step === 1 && diagnosticChoice === null) || (step === 3 && exerciseChoice === null)}
            onPress={() => {
              if (step === 2 && cardIndex < COURSE.cards.length - 1) {
                setCardIndex((i) => i + 1);
              } else if (step === 3) {
                router.back();
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
                styles.btnPrimary,
                (step === 1 && diagnosticChoice === null) || (step === 3 && exerciseChoice === null) ? styles.btnDisabled : null,
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {step === 3 ? 'Terminer le cours' : step === 2 && cardIndex < COURSE.cards.length - 1 ? 'Suivant' : 'Continuer'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8], flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  courseTitle: { flex: 1, fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim, textAlign: 'center' },

  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 20, height: 5, borderRadius: 3, backgroundColor: colors.border },
  stepDotDone: { backgroundColor: colors.violetSoft },
  stepDotActive: { backgroundColor: colors.lime },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[5],
    gap: spacing[3],
    flex: 1,
    justifyContent: 'center',
    minHeight: 240,
  },
  accentBolt: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, lineHeight: 28 },
  cardBody: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  question: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, color: colors.text, lineHeight: 26 },

  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[4],
  },
  choiceSelected: { borderColor: colors.violet, backgroundColor: 'rgba(108,79,224,0.14)' },
  choiceCorrect: { borderColor: colors.lime, backgroundColor: 'rgba(232,255,94,0.1)' },
  choiceWrong: { borderColor: colors.critical, opacity: 0.6 },
  bullet: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bulletSelected: { borderColor: colors.violet, backgroundColor: colors.violet },
  bulletCorrect: { borderColor: colors.lime, backgroundColor: colors.lime },
  choiceText: { flex: 1, fontFamily: fontFamily.textMedium, fontSize: 15, color: colors.textDim },
  choiceTextSelected: { color: colors.text },

  quizPrompt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radii.lg, padding: spacing[4] },
  quizPromptText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.textDim, lineHeight: 23 },
  feedback: {
    marginTop: spacing[4],
    backgroundColor: 'rgba(232,255,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,255,94,0.3)',
    borderRadius: radii.md,
    padding: spacing[3],
  },
  feedbackText: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.text, lineHeight: 20 },

  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: 'auto' },
  btnGhost: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 16, paddingHorizontal: 22, justifyContent: 'center' },
  btnGhostText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim },
  btnPrimary: { borderRadius: radii.md, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  btnDisabled: { opacity: 0.4 },
});
