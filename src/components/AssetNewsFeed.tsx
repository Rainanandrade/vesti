import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchNews, NewsItem } from '../api/news';

type Props = {
  symbol: string;
  companyName?: string;
};

export default function AssetNewsFeed({ symbol, companyName }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Busca notícias gerais + filtra pelo ticker e nome
    fetchNews('mercado').then((all) => {
      if (cancelled) return;
      const term = symbol.toUpperCase();
      const nameTerm = (companyName || '').toLowerCase();
      const filtered = all.filter((n) => {
        const text = (n.title + ' ' + (n.source || '')).toLowerCase();
        return text.includes(term.toLowerCase()) || (nameTerm && text.includes(nameTerm));
      });
      // Se não achou nada filtrado, mostra as 5 mais recentes do mercado
      setNews(filtered.length > 0 ? filtered.slice(0, 10) : all.slice(0, 5));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [symbol, companyName]);

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (news.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="newspaper-outline" size={32} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Nenhuma notícia recente encontrada pra {symbol}.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>📰 Notícias relacionadas</Text>
      <Text style={styles.subtitle}>
        {news.some((n) => n.title.toUpperCase().includes(symbol.toUpperCase()))
          ? `Filtradas por ${symbol}`
          : 'Mercado em geral (nada específico de ' + symbol + ')'}
      </Text>

      {news.map((n, i) => (
        <TouchableOpacity
          key={i}
          style={styles.item}
          onPress={() => Linking.openURL(n.link)}
          activeOpacity={0.7}
        >
          <Text style={styles.itemTitle} numberOfLines={3}>{n.title}</Text>
          <View style={styles.itemFooter}>
            {n.source && (
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>{n.source}</Text>
              </View>
            )}
            <Ionicons name="open-outline" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  item: { padding: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  itemTitle: { fontSize: fontSize.body, fontWeight: '600', color: colors.text, lineHeight: 20 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  sourceBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  sourceText: { color: colors.primary, fontSize: fontSize.tiny, fontWeight: '800', letterSpacing: 0.3 },
});
