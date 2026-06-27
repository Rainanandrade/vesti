import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchAssetNews, NewsItem } from '../api/news';

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
    fetchAssetNews(symbol, companyName).then((all) => {
      if (cancelled) return;
      // Filtro extra local: só mantém notícias que mencionam o ticker
      // OU pelo menos uma palavra-chave do nome da empresa.
      const term = symbol.toUpperCase();
      const nameWords = (companyName || '')
        .toLowerCase()
        .replace(/\b(s\.?a\.?|on|pn|pna|pnb|unit|holding|fundo|de|do|da|investimento)\b/gi, '')
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      const filtered = all.filter((n) => {
        const text = (n.title + ' ' + (n.source || '')).toLowerCase();
        if (text.includes(term.toLowerCase())) return true;
        return nameWords.some((w) => text.includes(w));
      });
      setNews(filtered.slice(0, 15));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [symbol, companyName]);

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.emptyText, { marginTop: spacing.sm }]}>
          Buscando notícias sobre {symbol}...
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>📰 Notícias sobre {symbol}</Text>
      <Text style={styles.subtitle}>
        {companyName ? `Filtradas por ${symbol} e ${companyName}` : `Filtradas por ${symbol}`}
      </Text>

      {news.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="newspaper-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>
            Nenhuma notícia recente especificamente sobre {symbol}.
          </Text>
          <Text style={[styles.emptyText, { fontSize: fontSize.tiny, marginTop: 4 }]}>
            Tente novamente em algumas horas — atualizamos a cada hora.
          </Text>
        </View>
      ) : (
        news.map((n, i) => (
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
              {n.pubDate && (
                <Text style={styles.dateText}>{formatDate(n.pubDate)}</Text>
              )}
              <Ionicons name="open-outline" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function formatDate(rfc: string): string {
  try {
    const d = new Date(rfc);
    const diffH = Math.round((Date.now() - d.getTime()) / 3600000);
    if (diffH < 1) return 'agora';
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.round(diffH / 24);
    return `${diffD}d atrás`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  item: { padding: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  itemTitle: { fontSize: fontSize.body, fontWeight: '600', color: colors.text, lineHeight: 20 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 8 as any },
  sourceBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  sourceText: { color: colors.primary, fontSize: fontSize.tiny, fontWeight: '800', letterSpacing: 0.3 },
  dateText: { fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: 'auto' as any },
});
