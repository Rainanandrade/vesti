import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import PriceChart from '../components/PriceChart';
import { TICKERS } from '../data/tickers';

export default function EditAssetScreen({ navigation, route }: any) {
  const { activeWallet, updateAsset, removeAsset } = useApp();
  const symbol: string = route?.params?.symbol;
  const asset = activeWallet?.assets.find((a) => a.symbol === symbol);

  const [quantity, setQuantity] = useState(asset?.quantity.toString().replace('.', ',') || '');
  const [price, setPrice] = useState(asset?.avgPrice.toFixed(2).replace('.', ',') || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!asset || !activeWallet) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.errorText}>Ativo não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    const pr = parseFloat(price.replace(',', '.'));
    if (!isFinite(qty) || qty <= 0) {
      Alert.alert('Atenção', 'Quantidade inválida');
      return;
    }
    if (!isFinite(pr) || pr <= 0) {
      Alert.alert('Atenção', 'Preço médio inválido');
      return;
    }
    setSaving(true);
    try {
      await updateAsset(activeWallet.id, asset.symbol, { quantity: qty, avgPrice: pr });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Não foi possível salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir posição',
      `Tem certeza que deseja remover ${asset.symbol} da carteira?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await removeAsset(activeWallet.id, asset.symbol);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Não foi possível excluir', e?.message || 'Tente novamente.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar posição</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.assetHeader}>
            <Text style={styles.symbol}>{asset.symbol}</Text>
            <Text style={styles.name}>{asset.name}</Text>
          </View>

          {/* Gráfico histórico (apenas pra ativos tradeáveis na B3) */}
          {TICKERS.some((t) => t.symbol === asset.symbol) && (
            <View style={styles.chartBox}>
              <PriceChart symbol={asset.symbol} />
            </View>
          )}

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Preço médio (R$)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>
            O preço médio é o quanto você pagou por unidade (considerando taxas de corretagem).
          </Text>

          <Button
            title="Salvar alterações"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: spacing.lg }}
          />

          <Button
            title="Excluir posição"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  assetHeader: { marginBottom: spacing.lg },
  symbol: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary },
  name: { fontSize: fontSize.body, color: colors.textSecondary },
  chartBox: { marginBottom: spacing.lg, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg },
  label: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
  helper: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },
  errorText: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' },
});
