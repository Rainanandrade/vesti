import { Platform } from 'react-native';
import { Storage } from '../storage/storage';

const KEY_ENABLED = 'notifications_enabled';

// No-op no web — notificações push só funcionam em app nativo.
const isWeb = Platform.OS === 'web';

export async function getNotificationsEnabled(): Promise<boolean> {
  if (isWeb) return false;
  return (await Storage.get<boolean>(KEY_ENABLED)) ?? false;
}

export async function enableNotifications(): Promise<boolean> {
  if (isWeb) return false;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Vesti',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#820AD1',
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Abertura — seg a sex 09:55
    for (let day = 2; day <= 6; day++) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '📈 Mercado vai abrir', body: 'A B3 abre em 5 minutos.' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day,
          hour: 9,
          minute: 55,
        },
      });
    }
    // Fechamento — 17:00
    for (let day = 2; day <= 6; day++) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '🔔 Pregão encerrado', body: 'Dá uma olhada no resultado da sua carteira.' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day,
          hour: 17,
          minute: 0,
        },
      });
    }
    // Aporte — dia 5
    await Notifications.scheduleNotificationAsync({
      content: { title: '💰 Hora do aporte mensal', body: 'Constância é o segredo dos juros compostos.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        day: 5,
        hour: 10,
        minute: 0,
        repeats: true,
      },
    });
    // Pílula semanal
    await Notifications.scheduleNotificationAsync({
      content: { title: '💎 Pílula da semana', body: 'Nova dica esperando você no Vesti.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,
        hour: 8,
        minute: 0,
      },
    });

    await Storage.set(KEY_ENABLED, true);
    return true;
  } catch (err) {
    console.warn('enableNotifications failed', err);
    return false;
  }
}

export async function disableNotifications(): Promise<void> {
  if (isWeb) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
  await Storage.set(KEY_ENABLED, false);
}

export async function notifyGoalReached(label: string) {
  if (isWeb) return;
  if (!(await getNotificationsEnabled())) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title: '🏆 Meta conquistada!', body: `Você bateu ${label}. Próxima vem aí.` },
      trigger: null,
    });
  } catch {}
}

export async function notifyAssetDrop(symbol: string, pct: number) {
  if (isWeb) return;
  if (!(await getNotificationsEnabled())) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title: `⚠️ ${symbol} caiu ${pct.toFixed(1)}% hoje`, body: 'Quedas fazem parte.' },
      trigger: null,
    });
  } catch {}
}

export async function notifyImbalance(message: string) {
  if (isWeb) return;
  if (!(await getNotificationsEnabled())) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title: '⚖️ Carteira desbalanceada', body: message },
      trigger: null,
    });
  } catch {}
}
