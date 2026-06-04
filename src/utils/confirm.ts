import { Alert, Platform } from 'react-native';

/**
 * Confirm cross-platform: Alert.alert no nativo, window.confirm no web.
 * No web o Alert do React Native não funciona de forma confiável.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; cancelLabel?: string; destructive?: boolean },
) {
  const confirmLabel = options?.confirmLabel || 'Confirmar';
  const cancelLabel = options?.cancelLabel || 'Cancelar';

  if (Platform.OS === 'web') {
    // window.confirm é nativo do navegador, bloqueante e confiável
    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: options?.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

/**
 * Alert cross-platform: Alert.alert no nativo, window.alert no web.
 */
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }
  Alert.alert(title, message);
}
