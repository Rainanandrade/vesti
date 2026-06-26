import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { confirmAction } from '../utils/confirm';

type Comment = {
  id: string;
  user_id: string;
  author_name: string;
  symbol: string;
  content: string;
  created_at: string;
};

type Props = { symbol: string };

export default function AssetDiscussions({ symbol }: Props) {
  const { user } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('asset_comments')
      .select('id, user_id, author_name, symbol, content, created_at')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setComments(data as Comment[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [symbol]);

  const post = async () => {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login pra comentar.');
      return;
    }
    const content = text.trim();
    if (content.length < 3) return;
    if (content.length > 1000) {
      Alert.alert('Muito longo', 'Comentário tem que ter no máximo 1000 caracteres.');
      return;
    }
    setPosting(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setPosting(false);
      Alert.alert('Sessão expirada', 'Faz login de novo.');
      return;
    }
    const { error } = await supabase.from('asset_comments').insert({
      user_id: authUser.id,
      author_name: user.name || authUser.email?.split('@')[0] || 'Anônimo',
      symbol,
      content,
    });
    if (error) {
      Alert.alert('Ops', error.message);
    } else {
      setText('');
      await load();
    }
    setPosting(false);
  };

  const remove = (c: Comment) => {
    confirmAction(
      'Apagar comentário',
      'Tem certeza?',
      async () => {
        await supabase.from('asset_comments').delete().eq('id', c.id);
        load();
      },
      { confirmLabel: 'Apagar', destructive: true },
    );
  };

  return (
    <View>
      <Text style={styles.title}>💬 Discussões da comunidade</Text>
      <Text style={styles.subtitle}>O que outros investidores estão dizendo sobre {symbol}</Text>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={`Compartilhe sua opinião sobre ${symbol}...`}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <View style={styles.composerRow}>
          <Text style={styles.charCount}>{text.length}/1000</Text>
          <TouchableOpacity
            style={[styles.postBtn, (text.trim().length < 3 || posting) && { opacity: 0.5 }]}
            onPress={post}
            disabled={text.trim().length < 3 || posting}
          >
            <Ionicons name="send" size={14} color={colors.textLight} />
            <Text style={styles.postBtnText}>{posting ? 'Enviando...' : 'Publicar'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Seja o primeiro a comentar sobre {symbol}!</Text>
        </View>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={styles.comment}>
            <View style={styles.commentHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{c.author_name[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.author}>{c.author_name}</Text>
                <Text style={styles.date}>{formatRel(c.created_at)}</Text>
              </View>
              {user && c.user_id && (
                <TouchableOpacity onPress={() => remove(c)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentText}>{c.content}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function formatRel(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  composer: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider },
  input: { fontSize: fontSize.body, color: colors.text, minHeight: 60, textAlignVertical: 'top' },
  composerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  charCount: { fontSize: fontSize.tiny, color: colors.textTertiary },
  postBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  postBtnText: { color: colors.textLight, fontWeight: '700', marginLeft: 4 },
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  comment: { paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textLight, fontWeight: '800' },
  author: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  date: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 1 },
  commentText: { fontSize: fontSize.body, color: colors.text, lineHeight: 20 },
});
