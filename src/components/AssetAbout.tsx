import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';
import { fmtCompactBRL } from '../utils/format';

type Props = {
  ticker: TickerInfo;
  details: AssetDetails | null;
};

export default function AssetAbout({ ticker, details }: Props) {
  const isFII = ticker.type === 'fii';
  const isETF = ticker.type === 'etf';

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.symbol}>{ticker.symbol}</Text>
        <Text style={styles.name}>{details?.longName || ticker.name}</Text>

        {(details?.sector || details?.industry) && (
          <View style={styles.tagRow}>
            {details?.sector && (
              <View style={styles.tag}>
                <Ionicons name="business-outline" size={12} color={colors.primary} />
                <Text style={styles.tagText}>{details.sector}</Text>
              </View>
            )}
            {details?.industry && (
              <View style={styles.tag}>
                <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
                <Text style={styles.tagText}>{details.industry}</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.tagText, { color: colors.warning }]}>
                {isFII ? 'Fundo Imobiliário' : isETF ? 'ETF' : 'Ação'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Resumo da empresa */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Descrição</Text>
        </View>
        {details?.businessSummary ? (
          <Text style={styles.summary}>{details.businessSummary}</Text>
        ) : (
          <Text style={styles.empty}>
            {isFII
              ? 'Fundo de Investimento Imobiliário negociado na B3. Para mais detalhes, consulte o regulamento no site do administrador.'
              : isETF
              ? 'ETF (Exchange Traded Fund) que replica um índice da B3. Veja a composição na página do gestor.'
              : 'Descrição da empresa não disponível na fonte gratuita. Consulte o RI da empresa pra mais detalhes.'}
          </Text>
        )}
      </View>

      {/* Indicadores chave */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Indicadores chave</Text>
        </View>
        <View style={styles.grid}>
          <KeyValue label="Valor de Mercado" value={details?.marketCap ? fmtCompactBRL(details.marketCap) : '—'} />
          <KeyValue label="Cotação atual" value={details?.currentPrice ? `R$ ${details.currentPrice.toFixed(2)}` : '—'} />
          <KeyValue label="Mín 52 semanas" value={details?.fiftyTwoWeekLow ? `R$ ${details.fiftyTwoWeekLow.toFixed(2)}` : '—'} />
          <KeyValue label="Máx 52 semanas" value={details?.fiftyTwoWeekHigh ? `R$ ${details.fiftyTwoWeekHigh.toFixed(2)}` : '—'} />
          <KeyValue label="Beta (vs IBOV)" value={details?.beta ? details.beta.toFixed(2) : '—'} />
          <KeyValue label="DY (12m)" value={details?.dividendYield ? `${details.dividendYield.toFixed(2)}%` : '—'} />
        </View>
      </View>

      {/* Onde investir */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Onde comprar</Text>
        </View>
        <Text style={styles.helper}>
          {ticker.symbol} é negociado na B3 (Bolsa Brasileira). Pra comprar você precisa de conta em uma corretora autorizada.
        </Text>
        <View style={styles.brokers}>
          {['XP', 'BTG Pactual', 'Nubank', 'Inter', 'Rico', 'Clear', 'Toro'].map((b) => (
            <View key={b} style={styles.brokerChip}>
              <Text style={styles.brokerText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Links úteis */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="link-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Links úteis</Text>
        </View>
        <LinkRow
          icon="globe-outline"
          label="Ficha completa no Status Invest"
          onPress={() =>
            Linking.openURL(
              `https://statusinvest.com.br/${isFII ? 'fundos-imobiliarios' : isETF ? 'etfs' : 'acoes'}/${ticker.symbol.toLowerCase()}`,
            )
          }
        />
        <LinkRow
          icon="globe-outline"
          label="Página oficial da B3"
          onPress={() => Linking.openURL(`https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm`)}
        />
        <LinkRow
          icon="newspaper-outline"
          label="Notícias no InfoMoney"
          onPress={() => Linking.openURL(`https://www.infomoney.com.br/?s=${ticker.symbol}`)}
        />
      </View>
    </View>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="open-outline" size={14} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider },
  symbol: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary },
  name: { fontSize: fontSize.bodyLarge, color: colors.text, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: fontSize.tiny, color: colors.primary, fontWeight: '800', marginLeft: 4, letterSpacing: 0.3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginLeft: 6 },
  summary: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  empty: { fontSize: fontSize.body, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  kv: { width: '50%', paddingVertical: spacing.sm },
  kvLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '600', textTransform: 'uppercase' },
  kvValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  helper: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  brokers: { flexDirection: 'row', flexWrap: 'wrap' },
  brokerChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: colors.divider },
  brokerText: { fontSize: fontSize.small, color: colors.text, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  linkText: { fontSize: fontSize.body, color: colors.text, marginLeft: spacing.sm, fontWeight: '600' },
});
