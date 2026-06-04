import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  disableNotifications,
  enableNotifications,
  getNotificationsEnabled,
} from '../services/notifications';
import { BROKERS, getBrokerById } from '../data/brokers';
import { Modal, Pressable } from 'react-native';
import { confirmAction } from '../utils/confirm';

export default function SettingsScreen({ navigation }: any) {
  const {
    user,
    profile,
    setProfile,
    signOut,
    privacyMode,
    togglePrivacy,
    wallets,
    activeWalletId,
    setActiveWalletId,
    createWallet,
    deleteWallet,
  } = useApp();
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  // Suporta multi-corretora: lê brokerIds, com fallback pro legado brokerId
  const currentBrokerIds: string[] =
    profile?.brokerIds || (profile?.brokerId ? [profile.brokerId] : []);
  const currentBrokers = currentBrokerIds.map(getBrokerById).filter((b): b is any => !!b);

  const toggleBroker = async (brokerId: string) => {
    if (!profile) return;
    const next = currentBrokerIds.includes(brokerId)
      ? currentBrokerIds.filter((x) => x !== brokerId)
      : [...currentBrokerIds, brokerId];
    const updated = { ...profile, brokerIds: next, brokerId: undefined };
    await setProfile(updated);
  };

  const clearBrokers = async () => {
    if (!profile) return;
    const updated = { ...profile, brokerIds: [], brokerId: undefined };
    await setProfile(updated);
  };
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled);
  }, []);

  const handleToggleNotif = async (val: boolean) => {
    if (val) {
      const ok = await enableNotifications();
      if (!ok) {
        Alert.alert(
          'Permissão necessária',
          'Habilite as notificações do Vesti nas configurações do celular pra receber alertas.',
        );
        return;
      }
      setNotifEnabled(true);
    } else {
      await disableNotifications();
      setNotifEnabled(false);
    }
  };

  const handleAddWallet = async () => {
    if (newName.trim().length < 2) {
      Alert.alert('Atenção', 'Dê um nome à carteira');
      return;
    }
    await createWallet(newName.trim());
    setNewName('');
    setAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (wallets.length === 1) {
      Alert.alert('Não dá', 'Você precisa ter pelo menos uma carteira.');
      return;
    }
    confirmAction(
      'Apagar carteira',
      `Apagar "${name}" e todos os ativos dela?`,
      () => deleteWallet(id),
      { confirmLabel: 'Apagar', destructive: true },
    );
  };

  const handleSignOut = () => {
    confirmAction(
      'Sair',
      'Tem certeza que quer sair?',
      async () => {
        try {
          await signOut();
        } catch (err) {
          console.warn('signOut error', err);
        }
      },
      { confirmLabel: 'Sair', destructive: true },
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Configurações</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Configurações</Text>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile && (
            <View style={styles.profileBadge}>
              <Text style={styles.profileText}>Perfil {profile.type}</Text>
            </View>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Corretoras</Text>
        <TouchableOpacity onPress={() => setBrokerModalOpen(true)}>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {currentBrokers.length === 0
                    ? 'Selecionar corretoras'
                    : currentBrokers.length === 1
                      ? currentBrokers[0].name
                      : `${currentBrokers.length} corretoras`}
                </Text>
                <Text style={styles.rowSub}>
                  {currentBrokers.length === 0
                    ? 'Sugestões mais genéricas'
                    : currentBrokers.map((b) => b.name).join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Privacidade</Text>
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Modo privacidade</Text>
              <Text style={styles.rowSub}>Esconde todos os valores na tela</Text>
            </View>
            <Switch
              value={privacyMode}
              onValueChange={togglePrivacy}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Notificações</Text>
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Alertas do Vesti</Text>
              <Text style={styles.rowSub}>
                Abertura/fechamento do pregão, aporte mensal, pílulas semanais e celebração de metas
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Carteiras</Text>
        {wallets.map((w) => (
          <Card key={w.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveWalletId(w.id)}>
                <View style={styles.walletRow}>
                  {w.id === activeWalletId && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.rowTitle, { marginLeft: w.id === activeWalletId ? spacing.sm : 0 }]}>
                    {w.name}
                  </Text>
                </View>
                <Text style={styles.rowSub}>{w.assets.length} ativo{w.assets.length === 1 ? '' : 's'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(w.id, w.name)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {adding ? (
          <Card>
            <TextInput
              style={styles.input}
              placeholder="Nome da carteira"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <Button title="Cancelar" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title="Criar" onPress={handleAddWallet} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <TouchableOpacity style={styles.addCard} onPress={() => setAdding(true)}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.addCardText}>Nova carteira</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Política de Privacidade</Text>
                <Text style={styles.rowSub}>Como tratamos seus dados (LGPD)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { kind: 'terms' })}>
          <Card>
            <View style={styles.row}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Termos de Uso</Text>
                <Text style={styles.rowSub}>Regras e responsabilidades</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sobre</Text>
        <Card>
          <Text style={styles.aboutText}>
            Vesti v1.0{'\n\n'}
            App educacional de acompanhamento de carteira. Não é corretora nem aconselhamento financeiro.
            {'\n\n'}
            Cotações por brapi.dev, dividendos por Status Invest, IA por Groq.
          </Text>
        </Card>

        <Button title="Sair" variant="danger" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>

      <Modal visible={brokerModalOpen} animationType="slide" onRequestClose={() => setBrokerModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBrokerModalOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Suas corretoras</Text>
            <TouchableOpacity onPress={() => setBrokerModalOpen(false)}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Pronto</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ padding: spacing.md, fontSize: fontSize.body, color: colors.textSecondary }}>
            Selecione todas as corretoras que você usa. {currentBrokerIds.length > 0 && `${currentBrokerIds.length} selecionada${currentBrokerIds.length === 1 ? '' : 's'}.`}
          </Text>
          <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
            {currentBrokerIds.length > 0 && (
              <TouchableOpacity onPress={clearBrokers} style={{ marginBottom: spacing.md }}>
                <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '600' }}>
                  Limpar todas
                </Text>
              </TouchableOpacity>
            )}
            {BROKERS.map((b) => {
              const isSelected = currentBrokerIds.includes(b.id);
              return (
                <TouchableOpacity key={b.id} onPress={() => toggleBroker(b.id)} activeOpacity={0.7}>
                  <Card style={isSelected ? styles.brokerSelected : { marginBottom: spacing.sm }}>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.brokerOptName}>{b.name}</Text>
                        <Text style={styles.brokerOptNote}>{b.note}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? colors.primary : colors.textTertiary}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  headerBarTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarText: { color: colors.textLight, fontSize: 28, fontWeight: 'bold' },
  userName: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  userEmail: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' },
  profileBadge: {
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  profileText: { color: colors.primaryDark, fontSize: fontSize.small, fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: fontSize.bodyLarge, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addCardText: { color: colors.primary, fontWeight: '600', marginLeft: spacing.sm },
  aboutText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  brokerSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight, marginBottom: spacing.sm },
  brokerOptName: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  brokerOptNote: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
