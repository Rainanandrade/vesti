import { ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { PRIVACY_POLICY, TERMS_OF_USE } from '../data/legalDocs';

type Props = {
  route: { params?: { kind?: 'privacy' | 'terms' } };
  navigation: any;
};

export default function LegalDocScreen({ route, navigation }: Props) {
  const kind = route?.params?.kind || 'privacy';
  const content = kind === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE;
  const title = kind === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {renderMarkdown(content)}
      </ScrollView>
    </SafeAreaView>
  );
}

// Renderizador simples de markdown (suporta # ## ### - **bold** e parágrafos)
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const out: ReactElement[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trim = line.trim();

    if (trim === '---') {
      out.push(<View key={key++} style={styles.divider} />);
      continue;
    }
    if (trim === '') {
      out.push(<View key={key++} style={{ height: spacing.sm }} />);
      continue;
    }
    if (trim.startsWith('### ')) {
      out.push(<Text key={key++} style={styles.h3}>{trim.slice(4)}</Text>);
      continue;
    }
    if (trim.startsWith('## ')) {
      out.push(<Text key={key++} style={styles.h2}>{trim.slice(3)}</Text>);
      continue;
    }
    if (trim.startsWith('# ')) {
      out.push(<Text key={key++} style={styles.h1}>{trim.slice(2)}</Text>);
      continue;
    }
    if (trim.startsWith('- ')) {
      out.push(
        <View key={key++} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{renderInline(trim.slice(2))}</Text>
        </View>,
      );
      continue;
    }
    // Parágrafo normal
    out.push(<Text key={key++} style={styles.paragraph}>{renderInline(trim)}</Text>);
  }
  return out;
}

// Renderiza **bold** e ✅/❌ inline
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{p}</Text>;
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, marginVertical: spacing.md },
  h2: { fontSize: fontSize.title, fontWeight: '700', color: colors.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  h3: { fontSize: fontSize.bodyLarge, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  paragraph: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', marginVertical: 2, paddingLeft: spacing.sm },
  bulletDot: { fontSize: fontSize.body, color: colors.primary, marginRight: spacing.sm, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
});
