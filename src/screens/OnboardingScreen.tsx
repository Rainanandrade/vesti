import { useState } from 'react';
import { editorial } from '../theme/editorial';
import { EditorialState } from '../ui/editorial';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { palette, radii, space, typeScale } from '../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const slides: Array<{ eyebrow: string; title: string; description: string; icon: IconName; tint: string }> = [
  { eyebrow: 'Tudo no lugar', title: 'Seu dinheiro, com mais clareza', description: 'Carteira, rendimentos e evolução reunidos numa visão simples para você saber onde está.', icon: 'pie-chart-outline', tint: palette.brandSoft },
  { eyebrow: 'Planos possíveis', title: 'Transforme intenção em próximos passos', description: 'Organize metas e aportes com recomendações que respeitam o seu momento.', icon: 'flag-outline', tint: palette.accentSoft },
  { eyebrow: 'Decisões conscientes', title: 'Entenda antes de decidir', description: 'O Vesti traduz seus números e explica o que merece atenção, sem complicar.', icon: 'sparkles-outline', tint: palette.successSoft },
];

export default function OnboardingScreen() {
  const { finishOnboarding } = useApp();
  const [page, setPage] = useState(0);
  const slide = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <Logo variant="wordmark" size={32} />
          {!isLast ? <Pressable accessibilityRole="button" onPress={finishOnboarding} hitSlop={12}><Text style={styles.skip}>Pular</Text></Pressable> : <View style={styles.skipPlaceholder} />}
        </View>
        <View style={styles.content}>
          <View style={[styles.illustration, { backgroundColor: slide.tint }]}>
            <View style={styles.orbitLarge} />
            <View style={styles.orbitSmall} />
            <View style={styles.iconDisc}><Ionicons name={slide.icon} size={52} color={palette.brand} /></View>
          </View>
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.progress} accessibilityLabel={`Etapa ${page + 1} de ${slides.length}`}>
            {slides.map((_, index) => <View key={index} style={[styles.progressTrack, index === page && styles.progressActive]} />)}
          </View>
          <Button title={isLast ? 'Começar agora' : 'Continuar'} onPress={() => isLast ? finishOnboarding() : setPage((current) => current + 1)} icon={<Ionicons name="arrow-forward" size={20} color={palette.onBrand} />} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  shell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: space.xl },
  topBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { color: palette.brand, fontSize: typeScale.body, fontWeight: '700' },
  skipPlaceholder: { width: 36 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: space.xl },
  illustration: { width: 224, height: 224, borderRadius: 72, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: space.xxl },
  orbitLarge: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: 'rgba(91,76,240,0.18)' },
  orbitSmall: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: 'rgba(91,76,240,0.24)' },
  iconDisc: { width: 92, height: 92, borderRadius: 46, backgroundColor: palette.canvasRaised, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: palette.brand, fontSize: typeScale.label, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: space.md },
  title: { color: palette.ink, fontSize: typeScale.display, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2, textAlign: 'center', maxWidth: 520 },
  description: { color: palette.inkSecondary, fontSize: typeScale.bodyLarge, lineHeight: 26, textAlign: 'center', maxWidth: 470, marginTop: space.lg },
  footer: { paddingBottom: space.lg },
  progress: { flexDirection: 'row', gap: space.sm, justifyContent: 'center', marginBottom: space.xl },
  progressTrack: { width: 28, height: 4, borderRadius: radii.pill, backgroundColor: palette.border },
  progressActive: { width: 52, backgroundColor: palette.brand },
});
