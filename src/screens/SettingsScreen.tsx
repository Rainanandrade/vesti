import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    resetProfile,
    signOut,
    privacyMode,
    togglePrivacy,
    wallets,
    activeWalletId,
    setActiveWalletId,
    createWallet,
    deleteWallet,
    operations,
    proventos,
    snapshots,
    watchlist,
    goalsReached,
    activeWallet,
    updateUserName,
    clearAllUserData,
  } = useApp();
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  const handleSaveName = async () => {
    if (editName.trim().length < 2) {
      Alert.alert('Atenção', 'Digite um nome válido.');
      return;
    }
    try {
      await updateUserName(editName.trim());
      setNameModalOpen(false);
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível atualizar.');
    }
  };

  const handleExport = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email },
      profile,
      wallets,
      operations,
      proventos,
      snapshots,
      watchlist,
      goalsReached,
    };
    const json = JSON.stringify(payload, null, 2);
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vesti-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: 'Backup Vesti' });
      }
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível exportar.');
    }
  };

  const handleShareWithAccountant = async () => {
    const year = new Date().getFullYear() - 1;
    const yearStr = String(year);
    const ops = operations.filter((o) => o.date.startsWith(yearStr));
    const pvs = proventos.filter((p) => p.date.startsWith(yearStr));
    const divs = pvs.filter((p) => p.kind !== 'jcp').reduce((s, p) => s + p.amount, 0);
    const jcps = pvs.filter((p) => p.kind === 'jcp').reduce((s, p) => s + p.amount, 0);
    const sold = ops.filter((o) => o.type === 'sell').reduce((s, o) => s + o.price * o.quantity, 0);
    const bought = ops.filter((o) => o.type === 'buy').reduce((s, o) => s + o.price * o.quantity, 0);

    const msg = `Olá, segue resumo da minha movimentação em ${year} pra Declaração IR ${year + 1} (gerado pelo Vesti):

📦 BENS E DIREITOS (posição atual):
${(activeWallet?.assets || [])
  .map((a) => `• ${a.symbol} (${a.name}) — ${a.quantity} cotas a R$ ${a.avgPrice.toFixed(2)} = R$ ${(a.quantity * a.avgPrice).toFixed(2)}`)
  .join('\n') || '(sem ativos)'}

💰 DIVIDENDOS RECEBIDOS (isentos, cód. 09):
Total: R$ ${divs.toFixed(2)}

🏦 JCP RECEBIDOS (tributação exclusiva, cód. 10):
Total: R$ ${jcps.toFixed(2)}

📊 OPERAÇÕES ${year}:
• Total comprado: R$ ${bought.toFixed(2)}
• Total vendido: R$ ${sold.toFixed(2)}
• Nº de operações: ${ops.length}

Pra detalhe operação a operação, posso exportar o JSON completo no Vesti.`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ text: msg, title: 'Resumo IR pra contador' });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(msg);
          Alert.alert('Copiado!', 'O resumo foi copiado pra área de transferência. Cola no email/WhatsApp do contador.');
        }
      } else {
        await Share.share({ message: msg, title: 'Resumo IR pra contador' });
      }
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível compartilhar.');
    }
  };

  const handleClearData = () => {
    confirmAction(
      'Limpar todos os dados',
      'Vai apagar TODAS suas carteiras, operações, proventos, snapshots, watchlist e metas. Sua conta e perfil ficam. Essa ação é IRREVERSÍVEL.',
      async () => {
        try {
          await clearAllUserData();
          Alert.alert('Pronto', 'Seus dados foram apagados. Comece do zero.');
        } catch (e: any) {
          Alert.alert('Ops', e?.message || 'Falha ao limpar.');
        }
      },
      { confirmLabel: 'Apagar tudo', destructive: true },
    );
  };

  const handleRedoProfile = () => {
    confirmAction(
      'Refazer perfil',
      'Você vai responder o quiz de perfil de novo. Sua carteira, metas e conquistas são preservadas.',
      async () => {
        try {
          await resetProfile();
          navigation?.goBack?.();
        } catch (err) {
          console.warn('resetProfile error', err);
        }
      },
      { confirmLabel: 'Refazer', destructive: false },
    );
  };
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
        <Text style={styles.headerBarTitle}>Conta</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Conta</Text>

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
          <TouchableOpacity
            style={styles.editNameBtn}
            onPress={() => {
              setEditName(user?.name || '');
              setNameModalOpen(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editNameText}>Editar nome</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Perfil financeiro</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Preference')}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Preferência de longo prazo</Text>
                <Text style={styles.rowSub}>
                  {profile?.preference
                    ? `${profile.preference === 'sem_preferencia' ? 'Sem preferência (padrão)' : `Foco em ${profile.preference}`}`
                    : 'Não definida'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('DividendTarget')}
        >
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Ionicons name="trophy-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Meta de renda passiva</Text>
                <Text style={styles.rowSub}>
                  {profile?.dividendTarget
                    ? profile.dividendTarget.mode === 'monthly_amount'
                      ? `R$ ${profile.dividendTarget.value.toFixed(0)}/mês em dividendos`
                      : `DY de no mínimo ${profile.dividendTarget.value.toFixed(1)}% ao ano`
                    : 'Não definida — toque pra criar'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRedoProfile}>
          <Card>
            <View style={styles.row}>
              <Ionicons name="refresh-circle-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Refazer perfil financeiro</Text>
                <Text style={styles.rowSub}>
                  Recalcular tipo de perfil (conservador/moderado/arrojado/agressivo) refazendo o quiz
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

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

        <Text style={styles.sectionTitle}>Dados</Text>
        <TouchableOpacity onPress={handleShareWithAccountant}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Ionicons name="paper-plane-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Compartilhar com contador</Text>
                <Text style={styles.rowSub}>
                  Gera um resumo formatado do ano anterior pra mandar pro seu contador no WhatsApp/email
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExport}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>Exportar dados</Text>
                <Text style={styles.rowSub}>
                  Backup completo em JSON: carteiras, operações, proventos, snapshots e watchlist
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClearData}>
          <Card>
            <View style={styles.row}>
              <Ionicons name="trash-bin-outline" size={22} color={colors.danger} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.rowTitle, { color: colors.danger }]}>Limpar todos os dados</Text>
                <Text style={styles.rowSub}>
                  Apaga carteiras, operações, proventos, metas e watchlist. Conta permanece.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sobre</Text>
        <Card>
          <Text style={styles.aboutText}>
            Vesti v2.0{'\n\n'}
            App educacional de acompanhamento de carteira. Não é corretora nem aconselhamento financeiro.
            {'\n\n'}
            Cotações por brapi.dev, dividendos por Status Invest, IA por Groq.
          </Text>
        </Card>

        <Button title="Sair" variant="danger" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>

      <Modal visible={nameModalOpen} transparent animationType="fade" onRequestClose={() => setNameModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNameModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalSheetTitle}>Editar nome</Text>
            <TextInput
              style={[styles.input, { marginTop: spacing.md }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
              autoFocus
              autoCapitalize="words"
            />
            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <Button title="Cancelar" variant="ghost" onPress={() => setNameModalOpen(false)} style={{ flex: 1 }} />
              <Button title="Salvar" onPress={handleSaveName} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  editNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  editNameText: { color: colors.primary, fontWeight: '700', marginLeft: 4, fontSize: fontSize.small },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalSheetTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
});
