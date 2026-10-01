import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { editorial, editorialType } from '../../theme/editorial';

export function EditorialFormGroup({ title, detail, children, style }: { title?: string; detail?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.group, style]}>{title ? <Text style={styles.groupTitle}>{title}</Text> : null}{detail ? <Text style={styles.groupDetail}>{detail}</Text> : null}{children}</View>;
}

export function EditorialField({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={editorial.color.faint} style={[styles.input, props.multiline && styles.multiline, error && styles.inputError, style]} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>;
}

export function InlineFeedback({ tone = 'neutral', children }: { tone?: 'neutral' | 'positive' | 'error' | 'warning'; children: ReactNode }) {
  return <View style={[styles.feedback, feedbackStyles[tone].root]}><Text selectable style={[styles.feedbackText, feedbackStyles[tone].text]}>{children}</Text></View>;
}

const feedbackStyles = { neutral: { root: { backgroundColor: editorial.color.indigoSoft }, text: { color: editorial.color.ink } }, positive: { root: { backgroundColor: editorial.color.positiveSoft }, text: { color: editorial.color.positive } }, error: { root: { backgroundColor: editorial.color.dangerSoft }, text: { color: editorial.color.danger } }, warning: { root: { backgroundColor: editorial.color.warningSoft }, text: { color: editorial.color.warning } } } as const;
const styles = StyleSheet.create({ group: { gap: editorial.space.lg, paddingVertical: editorial.space.xl, borderTopWidth: 1, borderTopColor: editorial.color.line }, groupTitle: { ...editorialType.section }, groupDetail: { ...editorialType.caption, marginTop: -editorial.space.md }, field: { gap: editorial.space.sm }, label: { color: editorial.color.ink, fontSize: editorial.type.caption, fontWeight: '700' }, input: { minHeight: 48, borderWidth: 1, borderColor: editorial.color.line, borderRadius: editorial.radius.control, backgroundColor: editorial.color.canvasRaised, paddingHorizontal: editorial.space.lg, paddingVertical: editorial.space.md, color: editorial.color.ink, fontSize: 16 }, multiline: { minHeight: 112, textAlignVertical: 'top' }, inputError: { borderColor: editorial.color.danger }, hint: { color: editorial.color.muted, fontSize: editorial.type.kicker, lineHeight: 16 }, error: { color: editorial.color.danger, fontSize: editorial.type.kicker, lineHeight: 16 }, feedback: { padding: editorial.space.md, borderRadius: editorial.radius.soft }, feedbackText: { fontSize: editorial.type.caption, lineHeight: 18 } });
