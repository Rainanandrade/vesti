import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    emoji: '📊',
    title: 'Acompanhe sua carteira',
    description: 'Veja todos os seus investimentos em um só lugar, com cotações em tempo real direto da B3.',
    bg: '#E3F2FD',
  },
  {
    emoji: '🎯',
    title: 'Metas sem limite',
    description: 'Defina metas progressivas e celebre cada conquista. Quanto mais você avança, novas metas aparecem.',
    bg: '#FFF3E0',
  },
  {
    emoji: '🤖',
    title: 'Entenda cada decisão',
    description: 'Explicações simples sobre P/L, dividendos e tudo mais. Sem precisar ser especialista pra investir bem.',
    bg: '#E8F8EE',
  },
];

export default function OnboardingScreen() {
  const { finishOnboarding } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === slides.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const handleNext = () => {
    if (isLast) finishOnboarding();
    else scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width, backgroundColor: s.bg }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.description}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
          ))}
        </View>
        <Button title={isLast ? 'Começar' : 'Próximo'} onPress={handleNext} />
        {!isLast && (
          <Button
            title="Pular"
            variant="ghost"
            onPress={() => finishOnboarding()}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 120, marginBottom: spacing.xl },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
});
