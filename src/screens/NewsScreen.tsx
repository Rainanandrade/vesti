import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from '../components/Card';
import { fetchNews, NEWS_TOPICS, NewsItem } from '../api/news';
import { safeBackToTabs } from '../utils/navigation';

export default function NewsScreen({ navigation }: any) {
  const [topic, setTopic] = useState(NEWS_TOPICS[0].key);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNews(topic).then((arr) => {
      if (!cancelled) {
        setItems(arr);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [topic]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notícias do mercado</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicBar} contentContainerStyle={{ padding: spacing.md }}>
        {NEWS_TOPICS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.topicChip, topic === t.key && styles.topicChipActive]}
            onPress={() => setTopic(t.key)}
          >
            <Text style={[styles.topicText, topic === t.key && styles.topicTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Buscando notícias...</Text>
          </View>
        )}
        {!loading && items.length === 0 && (
          <Card>
            <Text style={styles.empty}>Sem notícias agora. Tenta outro tópico.</Text>
          </Card>
        )}
        {!loading && items.map((it, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(it.link)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <Text style={styles.newsTitle} numberOfLines={3}>{it.title}</Text>
              <View style={styles.metaRow}>
                {it.source && <Text style={styles.source}>{it.source}</Text>}
                <Text style={styles.date}>{formatRelative(it.pubDate)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRelative(pubDate: string): string {
  if (!pubDate) return '';
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const h = diff / (1000 * 60 * 60);
  if (h < 1) return `há ${Math.round(diff / 60000)}min`;
  if (h < 24) return `há ${Math.round(h)}h`;
  return `há ${Math.round(h / 24)}d`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  topicBar: { height: 56, maxHeight: 56, minHeight: 56, flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  topicChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, height: 38, minWidth: 110, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'transparent', marginRight: spacing.sm, flexShrink: 0 },
  topicChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  topicText: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  topicTextActive: { color: colors.textLight, fontWeight: '800' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  loadingBox: { alignItems: 'center', padding: spacing.xl },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  empty: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' },
  newsTitle: { fontSize: fontSize.body, fontWeight: '600', color: colors.text, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  source: { fontSize: fontSize.tiny, color: colors.primary, fontWeight: '700' },
  date: { fontSize: fontSize.tiny, color: colors.textTertiary },
});
