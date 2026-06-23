import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';

const PIN_LENGTH = 4;

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function PinScreen() {
  const { hasPin, setPin, verifyPin, markPinVerified, signOut, user } = useApp();
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
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      )}
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
  logoutText: { color: colors.primary, fontSize: fontSize.body },
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
