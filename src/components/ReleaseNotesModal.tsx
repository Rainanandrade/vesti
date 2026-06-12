import { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { ReleaseNote } from '../data/releaseNotes';
import Button from './Button';

type Props = {
  visible: boolean;
  notes: ReleaseNote[];
  onClose: () => void;
  onNavigate?: (routeName: string, params?: any) => void;
};

const { width } = Dimensions.get('window');
const SHEET_WIDTH = Math.min(width - 32, 380);

export default function ReleaseNotesModal({ visible, notes, onClose, onNavigate }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  if (notes.length === 0) return null;
  const isLast = page === notes.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SHEET_WIDTH);
    if (next !== page) setPage(next);
  };

  const handleNext = () => {
    if (isLast) onClose();
    else scrollRef.current?.scrollTo({ x: SHEET_WIDTH * (page + 1), animated: true });
  };

  const handleAction = (action: NonNullable<ReleaseNote['highlights'][0]['action']>) => {
    onClose();
    if (onNavigate) {
      setTimeout(() => onNavigate(action.navigateTo, action.params), 300);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { width: SHEET_WIDTH }]}>
          <View style={styles.bannerNew}>
            <Ionicons name="sparkles" size={14} color={colors.gold} />
            <Text style={styles.bannerNewText}>NOVIDADES</Text>
            <Ionicons name="sparkles" size={14} color={colors.gold} />
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ width: SHEET_WIDTH }}
          >
            {notes.map((note) => (
              <ScrollView
                key={note.version}
                style={{ width: SHEET_WIDTH }}
                contentContainerStyle={styles.notePage}
              >
                <View style={styles.versionRow}>
                  <Text style={styles.versionBadge}>v{note.version}</Text>
                  <Text style={styles.versionDate}>{formatDate(note.date)}</Text>
                </View>
                <Text style={styles.noteTitle}>{note.title}</Text>
                {note.subtitle && <Text style={styles.noteSubtitle}>{note.subtitle}</Text>}

                <View style={{ marginTop: spacing.lg }}>
                  {note.highlights.map((h, i) => (
                    <View key={i} style={styles.highlight}>
                      <Text style={styles.highlightEmoji}>{h.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.highlightTitle}>{h.title}</Text>
                        <Text style={styles.highlightDesc}>{h.description}</Text>
                        {h.action && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleAction(h.action!)}
                          >
                            <Text style={styles.actionBtnText}>{h.action.label}</Text>
                            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ))}
          </ScrollView>

          {/* Dots se houver mais de 1 versão */}
          {notes.length > 1 && (
            <View style={styles.dots}>
              {notes.map((_, i) => (
                <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Button
              title={isLast ? 'Entendido' : 'Próximo'}
              onPress={handleNext}
              style={{ alignSelf: 'stretch' }}
            />
            {!isLast && (
              <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
                <Text style={styles.skipText}>Pular</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${parseInt(d, 10)} de ${months[parseInt(m, 10) - 1]} de ${y}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  bannerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    marginHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  bannerNewText: {
    color: colors.textLight,
    fontSize: fontSize.tiny,
    fontWeight: '800',
    letterSpacing: 2,
    marginHorizontal: 8,
  },

  notePage: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  versionBadge: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    fontSize: fontSize.tiny,
    fontWeight: '700',
  },
  versionDate: { fontSize: fontSize.small, color: colors.textSecondary },
  noteTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm },
  noteSubtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },

  highlight: { flexDirection: 'row', marginBottom: spacing.md },
  highlightEmoji: { fontSize: 28, marginRight: spacing.md, marginTop: 2 },
  highlightTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  highlightDesc: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  actionBtnText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.small, marginRight: 4 },

  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.sm },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  skipBtn: { alignItems: 'center', paddingTop: spacing.sm },
  skipText: { color: colors.textSecondary, fontSize: fontSize.body },
});
