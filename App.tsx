import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from './src/context/AppContext';
import { OperationModalProvider } from './src/context/OperationModalContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
import ReleaseNotesModal from './src/components/ReleaseNotesModal';
import { CURRENT_VERSION, getUnseenNotes } from './src/data/releaseNotes';
import { navigate } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <OperationModalProvider>
          <RootNavigator />
          <ReleaseNotesGate />
          <StatusBar style="auto" />
        </OperationModalProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

// Mostra popup de novidades quando há versão nova vs última vista
function ReleaseNotesGate() {
  const { loading, user, profile, lastSeenVersion, markVersionSeen } = useApp();
  const [visible, setVisible] = useState(false);
  const [notes, setNotes] = useState<ReturnType<typeof getUnseenNotes>>([]);

  useEffect(() => {
    // Só mostra depois do app estar pronto + usuário logado + perfil setado
    if (loading || !user || !profile) return;
    const unseen = getUnseenNotes(lastSeenVersion);
    if (unseen.length > 0) {
      setNotes(unseen);
      // Pequeno delay pra não brigar com navegação inicial
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [loading, user, profile, lastSeenVersion]);

  const handleClose = async () => {
    setVisible(false);
    await markVersionSeen(CURRENT_VERSION);
  };

  return (
    <ReleaseNotesModal
      visible={visible}
      notes={notes}
      onClose={handleClose}
      onNavigate={(route, params) => navigate(route, params)}
    />
  );
}
