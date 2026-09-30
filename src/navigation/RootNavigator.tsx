import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import PinScreen from '../screens/PinScreen';
import PasswordRecoveryScreen from '../screens/PasswordRecoveryScreen';
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
import PlanningScreen from '../screens/PlanningScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LegalDocScreen from '../screens/LegalDocScreen';
import PreferenceScreen from '../screens/PreferenceScreen';
import ProSubscribeScreen from '../screens/ProSubscribeScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import IRAutomaticoScreen from '../screens/IRAutomaticoScreen';
import IAConsultorScreen from '../screens/IAConsultorScreen';
import BacktestScreen from '../screens/BacktestScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ShareWalletsScreen from '../screens/ShareWalletsScreen';
import AdaptiveTabBar, { DESKTOP_BREAKPOINT, SIDEBAR_WIDTH } from '../components/AdaptiveTabBar';
import { useWindowDimensions } from 'react-native';

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

function MainTabs() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  return (
    <Tab.Navigator
      tabBar={(props) => <AdaptiveTabBar {...props} />}
      screenLayout={isDesktop
        ? ({ children }) => <View style={{ flex: 1, marginLeft: SIDEBAR_WIDTH }}>{children}</View>
        : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tab.Screen name="Hoje" component={DashboardScreen} />
      <Tab.Screen name="Investir" component={PortfolioStackNavigator} />
      <Tab.Screen name="Planejar" component={PlanningScreen} />
      <Tab.Screen name="Aprender" component={LearnScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Aporte" component={AporteScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Goals" component={GoalsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Declaracao" component={DeclaracaoScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AIHub" component={AIHubScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DividendTarget" component={DividendTargetScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ProSubscribe" component={ProSubscribeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="IRAutomatico" component={IRAutomaticoScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="IAConsultor" component={IAConsultorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Backtest" component={BacktestScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ShareWallets" component={ShareWalletsScreen} options={{ presentation: 'modal' }} />
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
  const { loading, onboardingDone, user, hasPin, pinVerified, profile, passwordRecoveryActive } = useApp();

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
        {passwordRecoveryActive ? (
          <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
        ) : !onboardingDone ? (
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
