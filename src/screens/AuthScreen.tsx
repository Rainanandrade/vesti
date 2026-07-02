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
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';

type Mode = 'signup' | 'signin' | 'forgot' | 'sent';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, user } = useApp();
  const [mode, setMode] = useState<Mode>(user ? 'signin' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setErrorMsg('Digite um email válido.');
      return;
    }
    if (mode === 'forgot') {
      setLoading(true);
      const res = await resetPassword(email.trim());
      setLoading(false);
      if (res.ok) {
        setMode('sent');
      } else {
        Alert.alert('Ops', res.error || 'Não foi possível enviar o email.');
      }
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && name.trim().length < 2) {
      setErrorMsg('Digite seu nome.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await signUp(name.trim(), email.trim(), password);
        if (!res.ok) {
          const msg = (res.error || '').toLowerCase();
          if (msg.includes('already') || msg.includes('registered') || msg.includes('exist')) {
            setErrorMsg('Já existe uma conta com esse email. Toque em "Entrar" pra fazer login.');
          } else if (msg.includes('email')) {
            setErrorMsg('Email inválido. Verifique se digitou certo.');
          } else if (msg.includes('password') || msg.includes('senha')) {
            setErrorMsg('Senha fraca. Use pelo menos 6 caracteres.');
          } else {
            setErrorMsg(res.error || 'Erro ao criar conta. Tente de novo.');
          }
        } else if (res.needsConfirmation) {
          setConfirmationMsg(
            `Enviamos um email pra ${email.trim()}. Clique no link de confirmação pra ativar sua conta.`,
          );
          setMode('sent');
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.ok) {
          const msg = (res.error || '').toLowerCase();
          if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('login')) {
            setErrorMsg('Email ou senha incorretos. Tente de novo.');
          } else if (msg.includes('not confirmed') || msg.includes('confirm')) {
            setErrorMsg('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
          } else if (msg.includes('too many') || msg.includes('rate')) {
            setErrorMsg('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
          } else {
            setErrorMsg(res.error || 'Email ou senha incorretos.');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Logo size={88} />
          </View>
          <Text style={styles.logo}>Vesti</Text>
          <Text style={styles.tagline}>Sua carteira em tempo real</Text>

          {mode === 'sent' ? (
            <View style={styles.card}>
              <Text style={styles.sentEmoji}>📬</Text>
              <Text style={styles.sentTitle}>Email enviado!</Text>
              <Text style={styles.sentText}>
                {confirmationMsg ||
                  `Enviamos um link de redefinição pra ${email}. Confira sua caixa de entrada (e o spam!).`}
              </Text>
              <Button
                title="Voltar pra entrada"
                variant="ghost"
                onPress={() => {
                  setMode('signin');
                  setConfirmationMsg(null);
                  setPassword('');
                }}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : mode === 'forgot' ? (
            <View style={styles.card}>
              <Text style={styles.forgotTitle}>Esqueci minha senha</Text>
              <Text style={styles.forgotSub}>
                Digite seu email. Vamos enviar um link pra você criar uma nova senha.
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="voce@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <Button title="Enviar link" onPress={handleSubmit} loading={loading} />
              <Button
                title="Voltar"
                variant="ghost"
                onPress={() => setMode('signin')}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                  onPress={() => setMode('signup')}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                    Criar conta
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signin' && styles.tabActive]}
                  onPress={() => setMode('signin')}
                >
                  <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Entrar</Text>
                </TouchableOpacity>
              </View>

              {mode === 'signup' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="voce@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {errorMsg && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Button
                title={mode === 'signup' ? 'Criar conta' : 'Entrar'}
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />

              {mode === 'signin' && (
                <TouchableOpacity onPress={() => setMode('forgot')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
                  <Text style={styles.forgotLink}>Esqueci minha senha</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.disclaimer}>
            Sua conta e dados ficam salvos na nuvem com criptografia. Você acessa do iPhone, Android ou navegador com a mesma conta.
            {'\n\n'}
            Ao criar conta, você concorda com a Política de Privacidade e os Termos de Uso (disponíveis em Ajustes).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  logo: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  tagline: { fontSize: fontSize.bodyLarge, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.background },
  tabText: { color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.text, fontWeight: '700' },
  field: { marginBottom: spacing.md },
  label: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
  },
  disclaimer: {
    marginTop: spacing.lg,
    fontSize: fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  forgotLink: { color: colors.primary, fontSize: fontSize.body, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as any,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  errorText: { flex: 1, color: colors.danger, fontWeight: '700', fontSize: fontSize.small, lineHeight: 18 },
  forgotTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  forgotSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },

  sentEmoji: { fontSize: 64, textAlign: 'center' },
  sentTitle: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sentText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
