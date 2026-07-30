import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';

const PIN_LENGTH = 4;

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function PinScreen() {
  const { hasPin, setPin, verifyPin, markPinVerified, signOut, user, resetPinWithPassword } = useApp();

  // Fluxo "Esqueci meu PIN": pede a SENHA da conta antes de deixar criar novo PIN
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const closeReset = () => {
    setResetOpen(false);
    setResetPassword('');
    setResetNewPin('');
    setResetConfirmPin('');
    setResetError(null);
  };

  const submitReset = async () => {
    setResetError(null);
    if (!resetPassword) {
      setResetError('Digite a senha da sua conta.');
      return;
    }
    if (!/^\d{4}$/.test(resetNewPin)) {
      setResetError('O novo PIN precisa ter exatamente 4 dígitos.');
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      setResetError('Os PINs não conferem. Digite o mesmo nos dois campos.');
      return;
    }
    setResetLoading(true);
    const res = await resetPinWithPassword(resetPassword, resetNewPin);
    setResetLoading(false);
    if (res.ok) {
      closeReset();
      Alert.alert('PIN redefinido', 'Seu novo PIN já está ativo.');
    } else {
      setResetError(res.error || 'Não foi possível redefinir agora.');
      setResetPassword('');
    }
  };
  const isSetup = !hasPin;
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPinState] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Re-render por segundo enquanto está em lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const isLocked = lockedUntil != null && Date.now() < lockedUntil;
  const secondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleComplete = async () => {
    if (isSetup) {
      if (step === 'first') {
        setFirstPin(pin);
        setStep('confirm');
        setPinState('');
      } else {
        if (pin === firstPin) {
          await setPin(pin);
        } else {
          Alert.alert('PIN não confere', 'Tente novamente.');
          setStep('first');
          setFirstPin('');
          setPinState('');
        }
      }
    } else {
      const ok = await verifyPin(pin);
      if (ok) {
        setAttempts(0);
        setLockedUntil(null);
        markPinVerified();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setShake(true);
        setPinState('');
        setTimeout(() => setShake(false), 400);
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          Alert.alert(
            'Muitas tentativas',
            'Você errou 5 vezes. Espera 1 minuto antes de tentar novamente, ou faz logout pra recomeçar.',
          );
        }
      }
    }
  };

  const press = (digit: string) => {
    if (isLocked) return;
    if (pin.length < PIN_LENGTH) setPinState(pin + digit);
  };

  const backspace = () => setPinState(pin.slice(0, -1));

  const title = isSetup
    ? step === 'first'
      ? 'Crie um PIN de 4 dígitos'
      : 'Confirme o PIN'
    : `Olá, ${user?.name?.split(' ')[0] || ''}`;

  const subtitle = isSetup
    ? 'Será pedido toda vez que você abrir o app'
    : 'Digite seu PIN pra continuar';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Logo size={56} />
        <Text style={[styles.title, { marginTop: 16 }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.dots, shake && styles.shake]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>

      {isLocked && (
        <View style={styles.lockoutBox}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.danger} />
          <Text style={styles.lockoutText}>Bloqueado por mais {secondsLeft}s</Text>
        </View>
      )}

      <View style={styles.pad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'back'],
        ].map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((k, i) => {
              if (k === '') return <View key={i} style={styles.key} />;
              if (k === 'back')
                return (
                  <TouchableOpacity key={i} style={styles.key} onPress={backspace}>
                    <Ionicons name="backspace-outline" size={28} color={colors.text} />
                  </TouchableOpacity>
                );
              return (
                <TouchableOpacity key={i} style={styles.key} onPress={() => press(k)}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {!isSetup && (
        <View style={styles.footerActions}>
          <TouchableOpacity onPress={() => setResetOpen(true)}>
            <Text style={styles.forgotText}>Esqueci meu PIN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal: redefinir PIN com senha da conta */}
      <Modal visible={resetOpen} transparent animationType="slide" onRequestClose={closeReset}>
        <Pressable style={styles.backdrop} onPress={closeReset}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.sheetHeader}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                  <Text style={styles.sheetTitle}>Redefinir PIN</Text>
                </View>

                <View style={styles.securityNote}>
                  <Ionicons name="lock-closed" size={14} color={colors.warning} />
                  <Text style={styles.securityNoteText}>
                    Por segurança, confirme a <Text style={{ fontWeight: '800' }}>senha da sua conta</Text>. Isso
                    impede que alguém com o seu celular em mãos troque o PIN.
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Senha da conta</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  placeholder="Sua senha de login"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>Novo PIN (4 dígitos)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={resetNewPin}
                  onChangeText={(t) => setResetNewPin(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />

                <Text style={styles.fieldLabel}>Confirme o novo PIN</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={resetConfirmPin}
                  onChangeText={(t) => setResetConfirmPin(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />

                {resetError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorBoxText}>{resetError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.sheetPrimaryBtn, resetLoading && { opacity: 0.6 }]}
                  onPress={submitReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color={colors.textLight} />
                  ) : (
                    <Text style={styles.sheetPrimaryText}>Redefinir PIN</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={closeReset} style={styles.sheetCancelBtn}>
                  <Text style={styles.sheetCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <Text style={styles.sheetFootnote}>
                  Não lembra a senha? Saia da conta e use "Esqueci minha senha" na tela de login — o link vai
                  pro seu email.
                </Text>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.xl },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    marginHorizontal: 10,
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  shake: { transform: [{ translateX: 6 }] },
  pad: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.sm },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 28, fontWeight: '500', color: colors.text },
  logoutBtn: { alignItems: 'center', paddingBottom: spacing.xl },
  logoutText: { color: colors.textSecondary, fontSize: fontSize.body },
  footerActions: { alignItems: 'center', paddingBottom: spacing.xl, gap: spacing.md as any },
  forgotText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700' },

  // Modal de reset de PIN
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 as any, marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  securityNote: {
    flexDirection: 'row',
    gap: 8 as any,
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  securityNoteText: { flex: 1, fontSize: fontSize.small, color: colors.text, lineHeight: 18 },
  fieldLabel: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as any,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorBoxText: { flex: 1, color: colors.danger, fontWeight: '700', fontSize: fontSize.small, lineHeight: 18 },
  sheetPrimaryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  sheetPrimaryText: { color: colors.textLight, fontWeight: '800', fontSize: fontSize.bodyLarge },
  sheetCancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  sheetCancelText: { color: colors.textSecondary, fontWeight: '700' },
  sheetFootnote: {
    fontSize: fontSize.tiny,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  lockoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginVertical: spacing.md,
    alignSelf: 'center',
  },
  lockoutText: { color: colors.danger, marginLeft: 6, fontWeight: '700' },
});
