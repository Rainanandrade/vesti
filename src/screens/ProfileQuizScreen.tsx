import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { computeProfile, QUIZ } from '../data/profileQuiz';
import { BROKERS, Broker, getBrokerById, brokerLimitations } from '../data/brokers';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

type Phase = 'quiz' | 'broker' | 'result';

export default function ProfileQuizScreen() {
  const { setProfile, createWallet, wallets } = useApp();
  const [phase, setPhase] = useState<Phase>('quiz');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [brokerIds, setBrokerIds] = useState<string[]>([]);
  const [brokerSearch, setBrokerSearch] = useState('');

  const toggleBroker = (id: string) =>
    setBrokerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const question = QUIZ[index];

  const handleAnswer = (score: number) => {
    const next = { ...answers, [question.id]: score };
    setAnswers(next);
    if (index < QUIZ.length - 1) {
      setIndex(index + 1);
    } else {
      setPhase('broker');
    }
  };

  const finalize = async () => {
    const profile = computeProfile(answers);
    profile.brokerIds = brokerIds;
    await setProfile(profile);
    if (wallets.length === 0) {
      await createWallet('Minha carteira');
    }
  };

  // FASE: Quiz de perguntas
  if (phase === 'quiz') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${((index + 1) / (QUIZ.length + 1)) * 100}%` }]} />
        </View>
        <Text style={styles.step}>
          Pergunta {index + 1} de {QUIZ.length}
        </Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.question}>{question.question}</Text>
          {question.helper && <Text style={styles.helper}>{question.helper}</Text>}
          {question.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={styles.option}
              onPress={() => handleAnswer(opt.score)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // FASE: Seleção da corretora
  if (phase === 'broker') {
    const grouped = {
      banco_digital: BROKERS.filter((b) => b.category === 'banco_digital'),
      corretora: BROKERS.filter((b) => b.category === 'corretora'),
      banco_tradicional: BROKERS.filter((b) => b.category === 'banco_tradicional'),
      internacional: BROKERS.filter((b) => b.category === 'internacional'),
    };
    const search = brokerSearch.toLowerCase().trim();
    const filterBy = (list: Broker[]) =>
      search ? list.filter((b) => b.name.toLowerCase().includes(search)) : list;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: '95%' }]} />
        </View>
        <View style={styles.brokerHeader}>
          <Text style={styles.brokerTitle}>Quais corretoras você usa?</Text>
          <Text style={styles.brokerSub}>
            Selecione todas que você tem. Comum usar mais de uma (ex: Nubank pra B3 + Nomad pra investir no exterior). A IA vai indicar onde comprar cada ativo.
          </Text>
          {brokerIds.length > 0 && (
            <Text style={styles.brokerSelectedCount}>
              {brokerIds.length} selecionada{brokerIds.length === 1 ? '' : 's'}
            </Text>
          )}
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar corretora"
            value={brokerSearch}
            onChangeText={setBrokerSearch}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {filterBy(grouped.banco_digital).length > 0 && (
            <BrokerGroup label="🏦 Bancos digitais" brokers={filterBy(grouped.banco_digital)} selected={brokerIds} onToggle={toggleBroker} />
          )}
          {filterBy(grouped.corretora).length > 0 && (
            <BrokerGroup label="📈 Corretoras" brokers={filterBy(grouped.corretora)} selected={brokerIds} onToggle={toggleBroker} />
          )}
          {filterBy(grouped.banco_tradicional).length > 0 && (
            <BrokerGroup label="🏛️ Bancos tradicionais" brokers={filterBy(grouped.banco_tradicional)} selected={brokerIds} onToggle={toggleBroker} />
          )}
          {filterBy(grouped.internacional).length > 0 && (
            <BrokerGroup label="🌍 Internacional" brokers={filterBy(grouped.internacional)} selected={brokerIds} onToggle={toggleBroker} />
          )}

          <View style={{ marginTop: spacing.lg }}>
            <Button title="Ver meu perfil" onPress={() => setPhase('result')} />
            <Button title="Pular por enquanto" variant="ghost" onPress={() => { setBrokerIds([]); setPhase('result'); }} style={{ marginTop: spacing.sm }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // FASE: Resultado
  const profile = computeProfile(answers);
  const selectedBrokers = brokerIds.map(getBrokerById).filter((b): b is Broker => !!b);
  const allLimits = selectedBrokers.length > 0
    ? Array.from(new Set(selectedBrokers.flatMap(brokerLimitations)))
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.tag}>Seu perfil é</Text>
        <Text style={styles.profileType}>{profile.type.toUpperCase()}</Text>
        <Text style={styles.description}>{profile.description}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sua estratégia sugerida</Text>
          <View style={styles.barRow}>
            <View style={[styles.bar, { flex: profile.strategy.renda_fixa, backgroundColor: colors.primary }]} />
            <View style={[styles.bar, { flex: profile.strategy.renda_variavel, backgroundColor: colors.success }]} />
            <View style={[styles.bar, { flex: profile.strategy.internacional, backgroundColor: colors.warning }]} />
          </View>
          <View style={styles.legend}>
            <Legend color={colors.primary} label={`Renda Fixa ${profile.strategy.renda_fixa}%`} />
            <Legend color={colors.success} label={`Renda Variável ${profile.strategy.renda_variavel}%`} />
            <Legend color={colors.warning} label={`Internacional ${profile.strategy.internacional}%`} />
          </View>
        </View>

        {selectedBrokers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Suas corretoras</Text>
            {selectedBrokers.map((b) => (
              <View key={b.id} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.brokerName}>{b.name}</Text>
                <Text style={styles.brokerNote}>{b.note}</Text>
              </View>
            ))}
            {allLimits.length > 0 && (
              <View style={styles.limitsBox}>
                <Text style={styles.limitsLabel}>⚠️ Limitações combinadas:</Text>
                <Text style={styles.limitsText}>{allLimits.join(' · ')}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Por onde começar</Text>
          {profile.recommendations.map((r, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{r}</Text>
            </View>
          ))}
        </View>

        <Button title="Vamos lá!" onPress={finalize} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BrokerGroup({
  label,
  brokers,
  selected,
  onToggle,
}: {
  label: string;
  brokers: Broker[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {brokers.map((b) => {
        const isSelected = selected.includes(b.id);
        return (
          <TouchableOpacity
            key={b.id}
            style={[styles.brokerItem, isSelected && styles.brokerItemActive]}
            onPress={() => onToggle(b.id)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.brokerItemName, isSelected && styles.brokerItemNameActive]}>
                {b.name}
              </Text>
              <Text style={styles.brokerItemNote}>{b.note}</Text>
            </View>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendStyles.row}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md, marginTop: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  label: { fontSize: fontSize.small, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progress: {
    height: 4,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  step: { fontSize: fontSize.small, color: colors.textSecondary, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  scroll: { padding: spacing.lg },
  question: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  helper: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.md },
  option: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: { fontSize: fontSize.bodyLarge, color: colors.text },

  // Broker phase
  brokerHeader: { padding: spacing.lg },
  brokerTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  brokerSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  brokerSelectedCount: { fontSize: fontSize.small, color: colors.primary, fontWeight: '700', marginTop: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, fontSize: fontSize.body, color: colors.text },
  group: { marginTop: spacing.md },
  groupLabel: { fontSize: fontSize.body, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  brokerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brokerItemActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  brokerItemName: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  brokerItemNameActive: { color: colors.primary },
  brokerItemNote: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },

  // Result phase
  tag: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  profileType: {
    fontSize: fontSize.hero,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: { fontSize: fontSize.bodyLarge, color: colors.text, textAlign: 'center', lineHeight: 24, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  cardTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  barRow: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
  bar: { height: 16 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  bullet: { flexDirection: 'row', marginTop: spacing.sm },
  bulletDot: { fontSize: fontSize.bodyLarge, color: colors.primary, marginRight: spacing.sm },
  bulletText: { flex: 1, fontSize: fontSize.body, color: colors.text, lineHeight: 20 },

  brokerName: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  brokerNote: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  limitsBox: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.warningLight, borderRadius: radius.md },
  limitsLabel: { fontSize: fontSize.small, fontWeight: '700', color: colors.text },
  limitsText: { fontSize: fontSize.body, color: colors.text, marginTop: 2 },
});
