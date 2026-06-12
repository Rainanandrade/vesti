import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { GLOSSARY, GlossaryTerm } from '../data/glossary';
import { Lesson, LESSONS, TRAILS, getTipOfWeek } from '../data/lessons';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { Preference } from '../data/profileQuiz';

// Reordena os trilhos com base na preferência: pra dividendos coloca FIIs/RV
// dividend payers primeiro; pra crescimento, RV growth primeiro
function reorderTrails(
  keys: (keyof typeof TRAILS)[],
  preference?: Preference,
): (keyof typeof TRAILS)[] {
  if (!preference || preference === 'sem_preferencia') return keys;
  if (preference === 'dividendos') {
    return ['fiis', 'rendaVariavel', 'estrategia', 'rendaFixa', 'iniciante'].filter((k) =>
      keys.includes(k as keyof typeof TRAILS),
    ) as (keyof typeof TRAILS)[];
  }
  if (preference === 'crescimento') {
    return ['rendaVariavel', 'estrategia', 'iniciante', 'fiis', 'rendaFixa'].filter((k) =>
      keys.includes(k as keyof typeof TRAILS),
    ) as (keyof typeof TRAILS)[];
  }
  return keys;
}

type Tab = 'aulas' | 'glossario';

export default function LearnScreen() {
  const { completedLessons } = useApp();
  const [tab, setTab] = useState<Tab>('aulas');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const totalCompleted = Object.keys(completedLessons).length;
  const totalLessons = LESSONS.length;

  if (selectedLesson) {
    return <LessonView lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />;
  }

  if (selectedTerm) {
    return <TermView term={selectedTerm} onBack={() => setSelectedTerm(null)} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Aprenda</Text>
          <View style={styles.progressPill}>
            <Ionicons name="ribbon" size={14} color={colors.primary} />
            <Text style={styles.progressPillText}>
              {totalCompleted}/{totalLessons} aulas
            </Text>
          </View>
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'aulas' && styles.tabActive]}
            onPress={() => setTab('aulas')}
          >
            <Text style={[styles.tabText, tab === 'aulas' && styles.tabTextActive]}>Aulas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'glossario' && styles.tabActive]}
            onPress={() => setTab('glossario')}
          >
            <Text style={[styles.tabText, tab === 'glossario' && styles.tabTextActive]}>Glossário</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'aulas' ? (
        <AulasTab
          onSelectLesson={setSelectedLesson}
          completedLessons={completedLessons}
        />
      ) : (
        <GlossarioTab onSelectTerm={setSelectedTerm} />
      )}
    </SafeAreaView>
  );
}

// =========================== AULAS ===========================

function AulasTab({
  onSelectLesson,
  completedLessons,
}: {
  onSelectLesson: (l: Lesson) => void;
  completedLessons: Record<string, number>;
}) {
  const { profile } = useApp();
  const tip = getTipOfWeek();
  // Ordem dos trilhos: padrão do iniciante OU adaptada por preferência do usuário
  const allKeys = Object.keys(TRAILS) as (keyof typeof TRAILS)[];
  const trailKeys = reorderTrails(allKeys, profile?.preference);
  const totalCompleted = Object.keys(completedLessons).length;
  const allLessonsDone = totalCompleted >= LESSONS.length;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card style={styles.tipCard}>
        <Text style={styles.tipLabel}>💎 Pílula da semana</Text>
        <Text style={styles.tipText}>{tip.emoji}  {tip.text}</Text>
      </Card>

      {allLessonsDone && (
        <Card style={styles.allDoneCard}>
          <Text style={styles.allDoneEmoji}>🏆</Text>
          <Text style={styles.allDoneTitle}>Você concluiu todas as aulas!</Text>
          <Text style={styles.allDoneSub}>
            Continuamos adicionando conteúdo novo periodicamente. Volte sempre.
          </Text>
        </Card>
      )}

      {trailKeys.map((key) => {
        const trail = TRAILS[key];
        const lessons = LESSONS.filter((l) => l.trail === key);
        const doneInTrail = lessons.filter((l) => l.id in completedLessons).length;
        return (
          <View key={key} style={styles.trailSection}>
            <View style={styles.trailHeader}>
              <View style={[styles.trailDot, { backgroundColor: trail.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trailLabel}>{trail.label}</Text>
                <Text style={styles.trailDesc}>{trail.description}</Text>
              </View>
              <View style={styles.trailProgressBox}>
                <Text style={styles.trailProgressText}>
                  {doneInTrail}/{lessons.length}
                </Text>
              </View>
            </View>
            {lessons.map((l) => {
              const score = completedLessons[l.id];
              const isCompleted = score != null;
              return (
                <TouchableOpacity key={l.id} onPress={() => onSelectLesson(l)} activeOpacity={0.7}>
                  <Card style={[styles.lessonCard, isCompleted && styles.lessonCardDone]}>
                    <Text style={styles.lessonEmoji}>{l.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.lessonTitle, isCompleted && styles.lessonTitleDone]}>
                          {l.title}
                        </Text>
                        {isCompleted && (
                          <View style={styles.doneBadge}>
                            <Ionicons name="checkmark" size={12} color={colors.textLight} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.lessonSummary} numberOfLines={2}>
                        {l.summary}
                      </Text>
                      <View style={styles.lessonMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                        <Text style={styles.lessonMetaText}>{l.readMinutes} min</Text>
                        {l.quiz && (
                          <>
                            <Ionicons name="help-circle-outline" size={12} color={colors.textTertiary} style={{ marginLeft: 8 }} />
                            <Text style={styles.lessonMetaText}>quiz · 3 perguntas</Text>
                          </>
                        )}
                        {isCompleted && score > 0 && (
                          <>
                            <Ionicons name="star" size={12} color={colors.gold} style={{ marginLeft: 8 }} />
                            <Text style={[styles.lessonMetaText, { color: colors.gold }]}>
                              {score}/{l.quiz?.length || 0}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { completedLessons, recordLesson } = useApp();
  const trail = TRAILS[lesson.trail];
  const quizQuestions = lesson.quiz || [];
  const wasCompleted = lesson.id in completedLessons;

  const [phase, setPhase] = useState<'reading' | 'quiz' | 'result'>('reading');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]); // index escolhido por pergunta
  const [showCelebration, setShowCelebration] = useState(false);

  const score = useMemo(
    () => answers.reduce((sum, ans, i) => sum + (quizQuestions[i]?.options[ans]?.correct ? 1 : 0), 0),
    [answers, quizQuestions],
  );

  const handleAnswer = (optIndex: number) => {
    const next = [...answers, optIndex];
    setAnswers(next);
  };

  const goNext = async () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Final do quiz
      const finalScore = answers.reduce(
        (sum, ans, i) => sum + (quizQuestions[i]?.options[ans]?.correct ? 1 : 0),
        0,
      );
      await recordLesson(lesson.id, finalScore);
      if (finalScore === quizQuestions.length) setShowCelebration(true);
      setPhase('result');
    }
  };

  const restart = () => {
    setPhase('reading');
    setCurrentQ(0);
    setAnswers([]);
    setShowCelebration(false);
  };

  // FASE: Quiz
  if (phase === 'quiz') {
    const q = quizQuestions[currentQ];
    const answered = answers.length > currentQ;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity onPress={() => setPhase('reading')} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerCenter}>
            Quiz · {currentQ + 1} de {quizQuestions.length}
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.quizProgress}>
          {quizQuestions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.quizProgressDot,
                i < answers.length && styles.quizProgressDotDone,
                i === currentQ && styles.quizProgressDotCurrent,
              ]}
            />
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.quizQuestion}>{q.question}</Text>
          {q.options.map((opt, i) => {
            const isAnswered = answered;
            const isSelected = isAnswered && answers[currentQ] === i;
            const status =
              isAnswered && opt.correct
                ? 'correct'
                : isSelected
                  ? 'wrong'
                  : 'idle';
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.quizOption,
                  status === 'correct' && styles.quizCorrect,
                  status === 'wrong' && styles.quizWrong,
                ]}
                onPress={() => !isAnswered && handleAnswer(i)}
                disabled={isAnswered}
              >
                <Text style={styles.quizOptionText}>{opt.text}</Text>
                {isAnswered && (isSelected || opt.correct) && (
                  <Text style={styles.quizExplanation}>
                    {opt.correct ? '✓ ' : '✗ '}
                    {opt.explanation}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          {answered && (
            <Button
              title={currentQ < quizQuestions.length - 1 ? 'Próxima pergunta' : 'Ver resultado'}
              onPress={goNext}
              style={{ marginTop: spacing.lg }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // FASE: Resultado
  if (phase === 'result') {
    const percent = (score / quizQuestions.length) * 100;
    const allCorrect = score === quizQuestions.length;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.resultBox}>
            <Text style={styles.resultEmoji}>
              {allCorrect ? '🏆' : score >= 2 ? '🎉' : '📚'}
            </Text>
            <Text style={styles.resultTitle}>
              {allCorrect
                ? 'Perfeito! Acertou tudo!'
                : score >= 2
                  ? 'Quase lá! Bom trabalho.'
                  : 'Revisa a aula e tenta de novo.'}
            </Text>
            <Text style={styles.resultScore}>
              {score} de {quizQuestions.length} corretas
            </Text>
            <View style={styles.resultBar}>
              <View
                style={[
                  styles.resultBarFill,
                  { width: `${percent}%`, backgroundColor: percent === 100 ? colors.success : percent >= 67 ? colors.warning : colors.danger },
                ]}
              />
            </View>
          </View>

          <Card style={styles.resultExplain}>
            <Text style={styles.resultExplainTitle}>Suas respostas</Text>
            {quizQuestions.map((q, i) => {
              const opt = q.options[answers[i]];
              const correct = opt?.correct;
              return (
                <View key={i} style={styles.resultLine}>
                  <Ionicons
                    name={correct ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={correct ? colors.success : colors.danger}
                  />
                  <Text style={styles.resultLineText}>{q.question}</Text>
                </View>
              );
            })}
          </Card>

          <Button title="Tentar de novo" variant="ghost" onPress={restart} style={{ marginTop: spacing.md }} />
          <Button title="Voltar pra aulas" onPress={onBack} style={{ marginTop: spacing.sm }} />
        </ScrollView>

        {/* Celebração */}
        <Modal visible={showCelebration} transparent animationType="fade" onRequestClose={() => setShowCelebration(false)}>
          <Pressable style={styles.celebrationBackdrop} onPress={() => setShowCelebration(false)}>
            <Pressable style={styles.celebrationCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.celebrationEmoji}>🏆</Text>
              <Text style={styles.celebrationTitle}>Mandou bem!</Text>
              <Text style={styles.celebrationMsg}>
                Você acertou todas as perguntas de "{lesson.title}". Continue assim!
              </Text>
              <Button title="Continuar" onPress={() => setShowCelebration(false)} style={{ marginTop: spacing.lg }} />
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  }

  // FASE: Leitura
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.lessonHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.trailBadge, { backgroundColor: trail.color }]}>
          <Text style={styles.trailBadgeText}>{trail.label}</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lessonHero}>{lesson.emoji}</Text>
        <Text style={styles.lessonHeroTitle}>{lesson.title}</Text>
        <View style={styles.lessonHeroMeta}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.lessonHeroMetaText}>{lesson.readMinutes} min de leitura</Text>
          {wasCompleted && (
            <>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginLeft: 12 }} />
              <Text style={[styles.lessonHeroMetaText, { color: colors.success }]}>Concluída</Text>
            </>
          )}
        </View>

        {lesson.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading && <Text style={styles.sectionHeading}>{s.heading}</Text>}
            {s.paragraphs.map((p, j) => (
              <Text key={j} style={styles.paragraph}>{p}</Text>
            ))}
            {s.bullets && (
              <View style={{ marginTop: spacing.sm }}>
                {s.bullets.map((b, k) => (
                  <View key={k} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
            {s.example && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>💡 {s.example.title}</Text>
                <Text style={styles.exampleText}>{s.example.text}</Text>
              </View>
            )}
            {s.warning && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.warningText}>{s.warning}</Text>
              </View>
            )}
          </View>
        ))}

        {quizQuestions.length > 0 && (
          <View style={styles.quizCallToAction}>
            <Text style={styles.quizCallTitle}>🎯 Teste o que aprendeu</Text>
            <Text style={styles.quizCallSub}>
              {quizQuestions.length} perguntas. Acertar todas conta como aula concluída.
            </Text>
            <Button
              title={wasCompleted ? 'Refazer quiz' : 'Começar quiz'}
              onPress={() => setPhase('quiz')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================== GLOSSÁRIO ===========================

function GlossarioTab({ onSelectTerm }: { onSelectTerm: (t: GlossaryTerm) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      GLOSSARY.filter(
        (t) =>
          t.term.toLowerCase().includes(query.toLowerCase()) ||
          t.short.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar termo (P/L, DY, Selic...)"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <Text style={styles.glossaryCount}>{filtered.length} termos</Text>

      {filtered.map((t) => (
        <TouchableOpacity key={t.term} onPress={() => onSelectTerm(t)} activeOpacity={0.7}>
          <Card style={styles.termCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.termTitle}>{t.term}</Text>
              <Text style={styles.termShort}>{t.short}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function TermView({ term, onBack }: { term: GlossaryTerm; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.lessonHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerCenter}>Glossário</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.term}>{term.term}</Text>
        <Text style={styles.short}>{term.short}</Text>
        <Text style={styles.full}>{term.full}</Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleLabel}>💡 Exemplo do dia-a-dia</Text>
          <Text style={styles.exampleText}>{term.example}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  headerArea: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  progressPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  progressPillText: { fontSize: fontSize.small, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.background },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  tipCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryAccent },
  tipLabel: { fontSize: fontSize.body, color: colors.primaryDark, fontWeight: '600' },
  tipText: { fontSize: fontSize.bodyLarge, color: colors.text, marginTop: spacing.xs, lineHeight: 22 },

  allDoneCard: { backgroundColor: colors.warningLight, borderColor: colors.warning, marginTop: spacing.md, alignItems: 'center' },
  allDoneEmoji: { fontSize: 48 },
  allDoneTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  allDoneSub: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },

  trailSection: { marginTop: spacing.lg },
  trailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  trailDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  trailLabel: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  trailDesc: { fontSize: fontSize.small, color: colors.textSecondary },
  trailProgressBox: { backgroundColor: colors.surfaceDark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  trailProgressText: { fontSize: fontSize.tiny, fontWeight: '700', color: colors.text },

  lessonCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  lessonCardDone: { backgroundColor: colors.successLight, borderColor: colors.success },
  lessonEmoji: { fontSize: 32, marginRight: spacing.md },
  lessonTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, flex: 1 },
  lessonTitleDone: { color: colors.text },
  doneBadge: { backgroundColor: colors.success, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  lessonSummary: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  lessonMetaText: { fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: 4 },

  // Lesson view
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  trailBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  trailBadgeText: { color: colors.textLight, fontSize: fontSize.tiny, fontWeight: '700', textTransform: 'uppercase' },
  headerCenter: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  lessonHero: { fontSize: 64, textAlign: 'center', marginTop: spacing.md },
  lessonHeroTitle: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  lessonHeroMeta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs },
  lessonHeroMetaText: { fontSize: fontSize.small, color: colors.textSecondary, marginLeft: 4 },

  section: { marginTop: spacing.lg },
  sectionHeading: { fontSize: fontSize.title, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  paragraph: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 24, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', marginVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9, marginRight: spacing.sm },
  bulletText: { flex: 1, fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 22 },

  exampleBox: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  exampleLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.primaryDark },
  exampleText: { fontSize: fontSize.bodyLarge, color: colors.text, marginTop: spacing.xs, lineHeight: 22 },

  warningBox: { flexDirection: 'row', backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  warningText: { flex: 1, fontSize: fontSize.body, color: colors.text, marginLeft: spacing.sm, lineHeight: 20 },

  quizCallToAction: { backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.xl, alignItems: 'center' },
  quizCallTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.primaryDark },
  quizCallSub: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },

  // Quiz
  quizProgress: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.sm },
  quizProgressDot: { width: 24, height: 6, backgroundColor: colors.divider, borderRadius: 3, marginHorizontal: 3 },
  quizProgressDotDone: { backgroundColor: colors.success },
  quizProgressDotCurrent: { backgroundColor: colors.primary },
  quizQuestion: { fontSize: fontSize.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.md, lineHeight: 28 },
  quizOption: { padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  quizCorrect: { backgroundColor: colors.successLight, borderColor: colors.success },
  quizWrong: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  quizOptionText: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 22 },
  quizExplanation: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },

  resultBox: { alignItems: 'center', padding: spacing.lg },
  resultEmoji: { fontSize: 72 },
  resultTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  resultScore: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.primary, marginTop: spacing.md },
  resultBar: { height: 12, backgroundColor: colors.divider, borderRadius: 6, width: '100%', marginTop: spacing.md, overflow: 'hidden' },
  resultBarFill: { height: 12, borderRadius: 6 },

  resultExplain: { marginTop: spacing.md },
  resultExplainTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  resultLine: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  resultLineText: { flex: 1, fontSize: fontSize.body, color: colors.text, marginLeft: spacing.sm, lineHeight: 18 },

  celebrationBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  celebrationCard: { backgroundColor: colors.background, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  celebrationEmoji: { fontSize: 80 },
  celebrationTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.primary, marginTop: spacing.sm },
  celebrationMsg: { fontSize: fontSize.bodyLarge, color: colors.text, textAlign: 'center', marginTop: spacing.md, lineHeight: 22 },

  // Glossário
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, fontSize: fontSize.body, color: colors.text },
  glossaryCount: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.sm },
  termCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  termTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  termShort: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },

  term: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary },
  short: { fontSize: fontSize.title, color: colors.text, marginTop: spacing.xs },
  full: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 24, marginTop: spacing.md },
});
