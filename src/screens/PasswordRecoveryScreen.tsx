import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { checkPassword } from '../utils/passwordStrength';
import { colors, fontSize, radius, spacing } from '../theme/colors';

export default function PasswordRecoveryScreen() {
  const { completePasswordRecovery } = useApp();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const strength = checkPassword(password);
    if (!strength.isValid) {
      setError(`Senha fraca: ${strength.issues.join(', ')}`);
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não conferem.');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await completePasswordRecovery(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'Não foi possível atualizar a senha.');
      return;
    }
    Alert.alert('Senha atualizada', 'Sua nova senha já está ativa.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size={72} />
          <Text style={styles.title}>Crie sua nova senha</Text>
          <Text style={styles.subtitle}>
            O link foi confirmado. Defina uma senha forte para voltar à sua conta.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nova senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="8+ caracteres, maiúscula e número"
            />

            <Text style={styles.label}>Confirme a nova senha</Text>
            <TextInput
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="Digite novamente"
            />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Atualizar senha"
              onPress={submit}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { marginTop: spacing.md, fontSize: fontSize.heading, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.sm, maxWidth: 420, textAlign: 'center', color: colors.textSecondary, lineHeight: 21 },
  card: { width: '100%', maxWidth: 440, marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg },
  label: { marginTop: spacing.md, marginBottom: 6, fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.body, color: colors.text, backgroundColor: colors.background },
  errorBox: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.dangerLight },
  errorText: { flex: 1, marginLeft: spacing.xs, color: colors.danger, fontSize: fontSize.small },
});
