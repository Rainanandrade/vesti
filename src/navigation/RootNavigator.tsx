import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import PinScreen from '../screens/PinScreen';
import ProfileQuizScreen from '../screens/ProfileQuizScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import AddAssetScreen from '../screens/AddAssetScreen';
import EditAssetScreen from '../screens/EditAssetScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import CompareAssetsScreen from '../screens/CompareAssetsScreen';
import IRCalculatorScreen from '../screens/IRCalculatorScreen';
import AporteCalculatorScreen from '../screens/AporteCalculatorScreen';
import OperacoesScreen from '../screens/OperacoesScreen';
import ProventosScreen from '../screens/ProventosScreen';
import AIHubScreen from '../screens/AIHubScreen';
import DeclaracaoScreen from '../screens/DeclaracaoScreen';
import DividendTargetScreen from '../screens/DividendTargetScreen';
// import IntegracoesScreen from '../screens/IntegracoesScreen'; // dormente até liberar premium
import RankingsScreen from '../screens/RankingsScreen';
import NewsScreen from '../screens/NewsScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import AssetsListScreen from '../screens/AssetsListScreen';
import AporteScreen from '../screens/AporteScreen';
import { globalOperationModalRef } from '../context/OperationModalContext';
import GoalsScreen from '../screens/GoalsScreen';
import LearnScreen from '../screens/LearnScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LegalDocScreen from '../screens/LegalDocScreen';
import PreferenceScreen from '../screens/PreferenceScreen';

// Ref de navegação global pra que o modal de release notes possa navegar fora
// da árvore React Navigation (App.tsx).
export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PortfolioStack = createNativeStackNavigator();

function PortfolioStackNavigator() {
  return (
    <PortfolioStack.Navigator screenOptions={{ headerShown: false }}>
      <PortfolioStack.Screen name="PortfolioMain" component={PortfolioScreen} />
      <PortfolioStack.Screen
        name="AddAsset"
        component={AddAssetScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="EditAsset"
        component={EditAssetScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="Compare"
        component={CompareAssetsScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="IRCalculator"
        component={IRCalculatorScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="AporteCalc"
        component={AporteCalculatorScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="Operacoes"
        component={OperacoesScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="Proventos"
        component={ProventosScreen}
        options={{ presentation: 'modal' }}
      />
      <PortfolioStack.Screen
        name="Declaracao"
        component={DeclaracaoScreen}
        options={{ presentation: 'modal' }}
      />
    </PortfolioStack.Navigator>
  );
}

function CenterTabButton({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
      <Ionicons name="add" size={28} color={colors.textLight} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 72,
          paddingBottom: 10,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Aportar') return <CenterTabButton focused={focused} />;
          const iconMap: Record<string, { active: any; inactive: any }> = {
            Início: { active: 'home', inactive: 'home-outline' },
            Carteira: { active: 'wallet', inactive: 'wallet-outline' },
            Metas: { active: 'trophy', inactive: 'trophy-outline' },
            Aprender: { active: 'book', inactive: 'book-outline' },
          };
          const icon = iconMap[route.name];
          const name = icon ? (focused ? icon.active : icon.inactive) : 'ellipse';
          return (
            <View style={focused ? styles.activeIconBg : undefined}>
              <Ionicons name={name} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Carteira" component={PortfolioStackNavigator} />
      <Tab.Screen
        name="Aportar"
        component={AporteScreen}
        options={{ tabBarLabel: '' }}
        listeners={({ navigation: nav }) => ({
          tabPress: (e) => {
            // Em vez de navegar pra AporteScreen, abre o modal de Nova operação
            e.preventDefault();
            globalOperationModalRef.current?.open();
          },
        })}
      />
      <Tab.Screen name="Metas" component={GoalsScreen} />
      <Tab.Screen name="Aprender" component={LearnScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="AIHub" component={AIHubScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DividendTarget" component={DividendTargetScreen} options={{ presentation: 'modal' }} />
      {/* Integrações Pluggy: rota escondida, ativar quando premium/produção estiver pronto
      <Stack.Screen name="Integracoes" component={IntegracoesScreen} options={{ presentation: 'modal' }} />
      */}
      <Stack.Screen name="Rankings" component={RankingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="News" component={NewsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AssetsList" component={AssetsListScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Legal" component={LegalDocScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="Preference"
        component={PreferenceScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, onboardingDone, user, hasPin, pinVerified, profile } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasPin ? (
          <Stack.Screen name="PinSetup" component={PinScreen} />
        ) : !pinVerified ? (
          <Stack.Screen name="PinEnter" component={PinScreen} />
        ) : !profile ? (
          <Stack.Screen name="Quiz" component={ProfileQuizScreen} />
        ) : !profile.preference ? (
          // Usuário antigo sem preferência: força a escolher antes de continuar
          <Stack.Screen name="ForcePreference">
            {() => <PreferenceScreen forced />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBtnActive: { backgroundColor: colors.primaryDark },
  activeIconBg: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
  },
});
