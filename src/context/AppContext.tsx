import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { Storage, KEYS, Secure, SECURE_KEYS, pinLockoutKey } from '../storage/storage';
import { Profile } from '../data/profileQuiz';
import { supabase } from '../services/supabase';
import { isPinLocked, normalizePinLockout, registerPinFailure } from '../utils/pinLockout';
// CommonJS keeps the timeout helper executable by the Node regression suite.
const { withTimeout } = require('../utils/async');
const { selectOwnedWallet, mapRecoveryWallet } = require('../utils/walletInvariant');
const { rebuildPositionFromOperations } = require('../utils/operationPosition');

type PinLockoutState = { attempts: number; lockedUntil: number | null };
type PinVerification = PinLockoutState & { ok: boolean };

export type Asset = {
  id?: string;
  symbol: string;
  name: string;
  type: 'acao' | 'fii' | 'etf' | 'tesouro' | 'cdb' | 'outro';
  quantity: number;
  avgPrice: number;
  addedAt: number;
  source?: 'manual' | 'pluggy';
  pluggyItemId?: string | null;
  lastSyncAt?: number | null;
};

export type Wallet = {
  id: string;
  name: string;
  assets: Asset[];
  createdAt: number;
  ownerId?: string;
  sharedRole?: 'viewer' | 'editor';
  readOnly?: boolean;
};

export type User = {
  name: string;
  email: string;
  createdAt: number;
};

type AppContextType = {
  loading: boolean;

  onboardingDone: boolean;
  finishOnboarding: () => Promise<void>;

  user: User | null;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; needsConfirmation?: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  passwordRecoveryActive: boolean;
  completePasswordRecovery: (password: string) => Promise<{ ok: boolean; error?: string }>;

  hasPin: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<PinVerification>;
  pinLockout: PinLockoutState;
  pinVerified: boolean;
  markPinVerified: () => void;
  resetPinSession: () => void;
  resetPinWithPassword: (password: string, newPin: string) => Promise<{ ok: boolean; error?: string; lockedUntil?: number }>;

  profile: Profile | null;
  setProfile: (p: Profile) => Promise<void>;
  resetProfile: () => Promise<void>;

  wallets: Wallet[];
  activeWalletId: string | null;
  activeWallet: Wallet | null;
  setActiveWalletId: (id: string) => Promise<void>;
  createWallet: (name: string) => Promise<Wallet>;
  ensureActiveWallet: () => Promise<Wallet>;
  deleteWallet: (id: string) => Promise<void>;

  addAsset: (walletId: string, asset: Asset) => Promise<void>;
  removeAsset: (walletId: string, symbol: string) => Promise<void>;
  updateAsset: (walletId: string, symbol: string, patch: Partial<Asset>) => Promise<void>;

  privacyMode: boolean;
  togglePrivacy: () => Promise<void>;

  goalsReached: number[];
  recordGoal: (value: number) => Promise<void>;

  completedLessons: Record<string, number>; // lesson_id -> quiz_score
  recordLesson: (lessonId: string, quizScore: number) => Promise<void>;

  watchlist: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  setWatchlistTarget: (symbol: string, targetPrice: number | null) => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;

  lastSeenVersion: string | null;
  markVersionSeen: (version: string) => Promise<void>;

  operations: Operation[];
  recordOperationAndUpdatePosition: (input: AtomicOperationInput) => Promise<void>;
  updateOperationAndPosition: (id: string, patch: Partial<Pick<Operation, 'quantity' | 'price' | 'fees' | 'withholdingTax' | 'date'>>) => Promise<void>;
  removeOperationAndUpdatePosition: (id: string) => Promise<void>;

  proventos: Provento[];
  addProvento: (p: Omit<Provento, 'id' | 'createdAt'>) => Promise<void>;
  removeProvento: (id: string) => Promise<void>;

  snapshots: PatrimonySnapshot[];
  recordSnapshot: (total: number, invested: number) => Promise<void>;

  updateUserName: (name: string) => Promise<void>;
  clearAllUserData: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  refreshFromCloud: () => Promise<void>;
  pro: ProStatus;
};

export type Provento = {
  id: string;
  symbol: string;
  kind: 'dividendo' | 'jcp' | 'rendimento';
  amount: number;
  perShare?: number;
  date: string;           // YYYY-MM-DD
  notes?: string;
  createdAt: number;
};

export type PatrimonySnapshot = {
  id: string;
  date: string;           // YYYY-MM-DD
  total: number;
  invested: number;
};

export type Operation = {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  assetType: 'acao' | 'fii' | 'etf' | 'daytrade';
  quantity: number;
  price: number;
  fees?: number;
  withholdingTax?: number;
  date: string;          // YYYY-MM-DD
  notes?: string;
  createdAt: number;
  walletId?: string;
};

export type AtomicOperationInput = {
  clientRequestId: string;
  payloadHash: string;
  walletId: string;
  type: Operation['type'];
  symbol: string;
  assetType: Operation['assetType'];
  quantity: number;
  price: number;
  fees?: number;
  withholdingTax?: number;
  date: string;
  name?: string;
};

const pendingOperationKey = (userId: string) => `pending_atomic_operation:${userId}`;

export type WatchlistItem = {
  symbol: string;
  name: string;
  type: string;
  targetPrice?: number;
  addedAt: number;
};

export type ProStatus = {
  isPro: boolean;         // true se dentro do prazo (pago OU trial)
  isTrial: boolean;       // true se trial ativo (não pagou ainda)
  isPaid: boolean;        // true se pagou de verdade
  daysLeft: number | null;// dias restantes (null se sem trial/sub)
  expiresAt: number | null;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinLockout, setPinLockout] = useState<PinLockoutState>({ attempts: 0, lockedUntil: null });
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [goalsReached, setGoalsReached] = useState<number[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Record<string, number>>({});
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);
  const [proExpiresAt, setProExpiresAt] = useState<number | null>(null);
  const [isPaidSubscriber, setIsPaidSubscriber] = useState<boolean>(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [snapshots, setSnapshots] = useState<PatrimonySnapshot[]>([]);
  const walletsRef = useRef<Wallet[]>([]);
  const walletRecoveryRef = useRef<Promise<Wallet> | null>(null);

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  // Carrega dados do usuário a partir do Supabase
  const loadUserData = useCallback(async (uid: string, email: string) => {
    // Profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (prof) {
      setUser({ name: prof.name, email, createdAt: Date.now() });
      setProfileState(prof.financial_profile || null);
      setPrivacyMode(!!prof.privacy_mode);
      setOnboardingDone(!!prof.onboarding_done);
      setProExpiresAt(prof.pro_expires_at ? new Date(prof.pro_expires_at).getTime() : null);
      setIsPaidSubscriber(!!prof.mercadopago_subscription_id);
      // Recupera a última versão vista do perfil em nuvem
      const remoteVer = prof.financial_profile?.lastSeenVersion;
      if (remoteVer) setLastSeenVersion(remoteVer);
    }

    // Wallets
    const { data: wts, error: walletsError } = await withTimeout(supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true }), 15000, 'Carregar carteiras');
    if (walletsError) throw new Error(translateDbError(walletsError.message));

    const { data: ats } = await supabase
      .from('assets')
      .select('*');

    const { data: receivedShares } = await supabase.rpc('list_my_wallet_invitations');
    const acceptedShares = new Map<string, 'viewer' | 'editor'>(
      (receivedShares || [])
        .filter((share: any) => share.status === 'accepted')
        .map(
          (share: any): [string, 'viewer' | 'editor'] => [
            share.wallet_id,
            share.role as 'viewer' | 'editor',
          ],
        ),
    );

    if (wts) {
      let walletList: Wallet[] = wts.map((w: any) => ({
        id: w.id,
        name: w.name,
        createdAt: new Date(w.created_at).getTime(),
        ownerId: w.user_id,
        sharedRole: w.user_id === uid ? undefined : acceptedShares.get(w.id),
        readOnly: w.user_id !== uid,
        assets: (ats || [])
          .filter((a: any) => a.wallet_id === w.id)
          .map((a: any) => ({
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            type: a.type,
            quantity: Number(a.quantity),
            avgPrice: Number(a.avg_price),
            addedAt: new Date(a.added_at).getTime(),
            source: (a.source || 'manual') as 'manual' | 'pluggy',
            pluggyItemId: a.pluggy_item_id ?? null,
            lastSyncAt: a.last_sync_at ? new Date(a.last_sync_at).getTime() : null,
          })),
      }));
      const active = wts.find((w: any) => w.user_id === uid && w.is_active);
      let ownedWallet = selectOwnedWallet(walletList, uid, active?.id);
      if (!ownedWallet) {
        const { data: recoveryRow, error: recoveryError } = await withTimeout(
          supabase
            .from('wallets')
            .insert({ user_id: uid, name: 'Carteira principal', is_active: true })
            .select()
            .single(),
          15000,
          'Preparar sua carteira',
        );
        if (recoveryError || !recoveryRow) throw new Error(translateDbError(recoveryError?.message || 'Sem resposta do servidor'));
        ownedWallet = mapRecoveryWallet(recoveryRow, uid);
        walletList = [ownedWallet, ...walletList];
      }
      walletsRef.current = walletList;
      setWallets(walletList);
      setActiveWalletIdState(ownedWallet.id);
    }

    // Goals reached
    const { data: goals } = await supabase
      .from('goals_reached')
      .select('value')
      .eq('user_id', uid);
    if (goals) setGoalsReached(goals.map((g: any) => Number(g.value)));

    // Lessons completed
    const { data: lessons } = await supabase
      .from('lessons_completed')
      .select('lesson_id, quiz_score')
      .eq('user_id', uid);
    if (lessons) {
      const map: Record<string, number> = {};
      lessons.forEach((l: any) => (map[l.lesson_id] = l.quiz_score ?? 0));
      setCompletedLessons(map);
    }

    // Watchlist
    const { data: wl } = await supabase
      .from('watchlist')
      .select('symbol, name, type, target_price, added_at')
      .eq('user_id', uid)
      .order('added_at', { ascending: false });
    if (wl) {
      setWatchlist(
        wl.map((w: any) => ({
          symbol: w.symbol,
          name: w.name,
          type: w.type,
          targetPrice: w.target_price != null ? Number(w.target_price) : undefined,
          addedAt: new Date(w.added_at).getTime(),
        })),
      );
    }

    // Operations (ledger pra IR)
    let { data: ops, error: operationsError } = await supabase
      .from('operations')
      .select('id, wallet_id, type, symbol, asset_type, quantity, price, fees, withholding_tax, date, notes, created_at')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (operationsError) {
      const fallback = await supabase
        .from('operations')
        .select('id, type, symbol, asset_type, quantity, price, fees, withholding_tax, date, notes, created_at')
        .eq('user_id', uid)
        .order('date', { ascending: false });
      ops = fallback.data as any;
    }
    if (ops) {
      setOperations(
        ops.map((o: any) => ({
          id: o.id,
          type: o.type,
          symbol: o.symbol,
          assetType: o.asset_type,
          quantity: Number(o.quantity),
          price: Number(o.price),
          fees: Number(o.fees || 0),
          withholdingTax: Number(o.withholding_tax || 0),
          date: o.date,
          notes: o.notes,
          createdAt: new Date(o.created_at).getTime(),
          walletId: o.wallet_id || readOperationWalletId(o.notes),
        })),
      );
    }

    // Proventos recebidos
    const { data: pvs } = await supabase
      .from('proventos')
      .select('id, symbol, kind, amount, per_share, date, notes, created_at')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (pvs) {
      setProventos(
        pvs.map((p: any) => ({
          id: p.id,
          symbol: p.symbol,
          kind: p.kind,
          amount: Number(p.amount),
          perShare: p.per_share != null ? Number(p.per_share) : undefined,
          date: p.date,
          notes: p.notes,
          createdAt: new Date(p.created_at).getTime(),
        })),
      );
    }

    // Snapshots de patrimônio (últimos 24 meses, basta isso pra gráfico)
    const { data: snaps } = await supabase
      .from('patrimony_snapshots')
      .select('id, date, total, invested')
      .eq('user_id', uid)
      .order('date', { ascending: true });
    if (snaps) {
      setSnapshots(
        snaps.map((s: any) => ({
          id: s.id,
          date: s.date,
          total: Number(s.total),
          invested: Number(s.invested),
        })),
      );
    }
  }, []);

  const handleRecoveryUrl = useCallback(async (url: string) => {
    if (!url.startsWith('vesti://password-recovery')) return;
    const params = getAuthParams(url);
    const code = params.get('code');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    } else {
      return;
    }
    setPasswordRecoveryActive(true);
  }, []);

  // Init: detecta sessão existente e dados locais (PIN, onboarding)
  useEffect(() => {
    (async () => {
      try {
        const [ob, pin, ver] = await Promise.allSettled([
          Storage.get<boolean>(KEYS.ONBOARDING_DONE),
          Secure.get(SECURE_KEYS.PIN),
          Storage.get<string>(KEYS.LAST_SEEN_VERSION),
        ]);
        if (ob.status === 'fulfilled') setOnboardingDone(!!ob.value);
        if (pin.status === 'fulfilled') setHasPin(!!pin.value);
        if (ver.status === 'fulfilled' && ver.value) setLastSeenVersion(ver.value);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          await loadUserData(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.warn('Init failed', err);
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Token refresh silencioso NÃO deve recarregar dados — isso sobrescreve
      // estado local recém-modificado (ex: usuário troca corretora → antes do
      // upsert responder, refresh dispara e volta o valor antigo).
      // Só recarrega em eventos que realmente mudam o usuário.
      const shouldReload = event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION';
      if (event === 'PASSWORD_RECOVERY') setPasswordRecoveryActive(true);
      if (session?.user) {
        setUserId(session.user.id);
        if (shouldReload) await loadUserData(session.user.id, session.user.email || '');
      } else {
        setUserId(null);
        setUser(null);
        setProfileState(null);
        setWallets([]);
        setActiveWalletIdState(null);
        setGoalsReached([]);
        setOperations([]);
        setProventos([]);
        setSnapshots([]);
        setPinVerified(false);
      }
    });
    Linking.getInitialURL()
      .then((url) => (url ? handleRecoveryUrl(url) : undefined))
      .catch((error) => console.warn('Password recovery link failed', error));
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleRecoveryUrl(url).catch((error) => console.warn('Password recovery link failed', error));
    });
    return () => {
      sub.subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, [handleRecoveryUrl, loadUserData]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setPinLockout({ attempts: 0, lockedUntil: null });
      return;
    }
    Storage.get<PinLockoutState>(pinLockoutKey(userId)).then((stored) => {
      if (!cancelled) setPinLockout(normalizePinLockout(stored));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const proStatus: ProStatus = (() => {
    const now = Date.now();

    // REGRA ÚNICA: Pro exige assinatura PAGA e ativa.
    // Sem trial, sem cortesia, sem "período de teste". Só libera quem tem
    // mercadopago_subscription_id preenchido E pro_expires_at no futuro.
    const hasActivePayment = isPaidSubscriber && !!proExpiresAt && proExpiresAt > now;

    if (!hasActivePayment) {
      return {
        isPro: false,
        isTrial: false,
        isPaid: false,
        daysLeft: null,
        expiresAt: proExpiresAt,
      };
    }

    const daysLeft = Math.max(0, Math.ceil((proExpiresAt! - now) / (24 * 60 * 60 * 1000)));
    return {
      isPro: true,
      isPaid: true,
      isTrial: false,
      daysLeft,
      expiresAt: proExpiresAt,
    };
  })();

  const refreshFromCloud = useCallback(async () => {
    if (!userId) return;
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || user?.email || '';
    await loadUserData(userId, email);
  }, [userId, user?.email, loadUserData]);

  const finishOnboarding = useCallback(async () => {
    await Storage.set(KEYS.ONBOARDING_DONE, true);
    setOnboardingDone(true);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: friendlyError(error.message) };
    const needsConfirmation = !data.session;
    return { ok: true, needsConfirmation };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: friendlyError(error.message) };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('supabase signOut error', err);
    }
    // Limpa estados local mesmo se signOut falhar
    setUser(null);
    setUserId(null);
    setProfileState(null);
    setWallets([]);
    setActiveWalletIdState(null);
    setGoalsReached([]);
    setCompletedLessons({});
    setPinVerified(false);
    setPasswordRecoveryActive(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'vesti://password-recovery',
    });
    if (error) return { ok: false, error: friendlyError(error.message) };
    return { ok: true };
  }, []);

  const completePasswordRecovery = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: friendlyError(error.message) };
    setPasswordRecoveryActive(false);
    return { ok: true };
  }, []);

  const setPin = useCallback(async (pin: string) => {
    await Secure.set(SECURE_KEYS.PIN, pin);
    if (userId) await Storage.removeRequired(pinLockoutKey(userId));
    setPinLockout({ attempts: 0, lockedUntil: null });
    setHasPin(true);
    setPinVerified(true);
  }, [userId]);

  const verifyPin = useCallback(async (pin: string): Promise<PinVerification> => {
    if (!userId) return { ok: false, attempts: 0, lockedUntil: null };
    const storedLockout = await Storage.get<PinLockoutState>(pinLockoutKey(userId));
    const current = normalizePinLockout(storedLockout);
    if (isPinLocked(current)) {
      setPinLockout(current);
      return { ok: false, ...current };
    }

    const stored = await Secure.get(SECURE_KEYS.PIN);
    if (stored === pin) {
      await Storage.removeRequired(pinLockoutKey(userId));
      const cleared = { attempts: 0, lockedUntil: null };
      setPinLockout(cleared);
      return { ok: true, ...cleared };
    }

    const next = registerPinFailure(current);
    await Storage.setRequired(pinLockoutKey(userId), next);
    setPinLockout(next);
    return { ok: false, ...next };
  }, [userId]);

  const markPinVerified = useCallback(() => setPinVerified(true), []);
  const resetPinSession = useCallback(() => setPinVerified(false), []);

  /**
   * Reset de PIN com re-autenticação por SENHA da conta.
   *
   * Segurança anti-roubo: se alguém rouba o celular desbloqueado com a sessão
   * ativa, o PIN é a barreira. Por isso o reset exige a SENHA — algo que o
   * ladrão não tem. Nunca reseta só com o dispositivo em mãos.
   *
   * Camadas:
   * - Rate limit local persistido: 3 tentativas / 15 min (sobrevive a restart do app)
   * - Após 3 falhas: bloqueia por 15 min E derruba a sessão (força login completo)
   * - Registra tentativas no audit_log do Supabase
   */
  const resetPinWithPassword = useCallback(
    async (password: string, newPin: string): Promise<{ ok: boolean; error?: string; lockedUntil?: number }> => {
      const email = user?.email;
      if (!email) return { ok: false, error: 'Sessão inválida. Faça login novamente.' };
      if (!/^\d{4}$/.test(newPin)) return { ok: false, error: 'O novo PIN precisa ter 4 dígitos.' };

      // 1) Checa rate limit local
      const now = Date.now();
      const stored = await Storage.get<{ count: number; firstAt: number; lockedUntil?: number }>(
        KEYS.PIN_RESET_ATTEMPTS,
      );
      const WINDOW_MS = 15 * 60 * 1000;
      const MAX_TRIES = 3;

      if (stored?.lockedUntil && now < stored.lockedUntil) {
        return {
          ok: false,
          error: 'Muitas tentativas erradas. Aguarde antes de tentar de novo.',
          lockedUntil: stored.lockedUntil,
        };
      }

      // Janela expirou → zera contador
      const inWindow = stored && now - stored.firstAt < WINDOW_MS;
      const attemptCount = inWindow ? stored!.count : 0;

      // 2) Re-autentica com a senha (prova de identidade)
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        const nextCount = attemptCount + 1;
        const shouldLock = nextCount >= MAX_TRIES;
        const lockedUntil = shouldLock ? now + WINDOW_MS : undefined;

        await Storage.set(KEYS.PIN_RESET_ATTEMPTS, {
          count: nextCount,
          firstAt: inWindow ? stored!.firstAt : now,
          lockedUntil,
        });

        // Registra tentativa falha (best-effort, não bloqueia o fluxo)
        supabase
          .from('audit_log')
          .insert({
            user_id: userId,
            action: 'pin.reset_failed',
            entity_type: 'auth',
            details: { attempt: nextCount, at: new Date().toISOString() },
          })
          .then(() => {}, () => {});

        if (shouldLock) {
          // Derruba a sessão: força login completo. Protege contra brute-force
          // com o aparelho em mãos.
          await supabase.auth.signOut();
          return {
            ok: false,
            error: 'Senha errada 3 vezes. Por segurança, você foi desconectado. Faça login novamente.',
            lockedUntil,
          };
        }

        const left = MAX_TRIES - nextCount;
        return {
          ok: false,
          error: `Senha incorreta. ${left} ${left === 1 ? 'tentativa' : 'tentativas'} restante${left === 1 ? '' : 's'} antes do bloqueio.`,
        };
      }

      // 3) Senha correta → grava novo PIN e limpa rate limit
      await Secure.set(SECURE_KEYS.PIN, newPin);
      if (userId) await Storage.removeRequired(pinLockoutKey(userId));
      setPinLockout({ attempts: 0, lockedUntil: null });
      setHasPin(true);
      setPinVerified(true);
      await Storage.remove(KEYS.PIN_RESET_ATTEMPTS);

      supabase
        .from('audit_log')
        .insert({
          user_id: userId,
          action: 'pin.reset_success',
          entity_type: 'auth',
          details: { at: new Date().toISOString() },
        })
        .then(() => {}, () => {});

      return { ok: true };
    },
    [user?.email, userId],
  );

  const setProfile = useCallback(async (p: Profile) => {
    if (userId) {
      // upsert garante criação caso o trigger não tenha rodado
      assertMutation(
        await withTimeout(supabase.from('profiles').upsert(
          { id: userId, name: user?.name || 'Usuário', financial_profile: p, onboarding_done: true },
          { onConflict: 'id' },
        ), 15000, 'Salvar o perfil'),
      );
    }
    setProfileState(p);
  }, [userId, user]);

  const resetProfile = useCallback(async () => {
    // Apaga financial_profile mas mantém o user
    if (userId) {
      assertMutation(
        await supabase
          .from('profiles')
          .update({ financial_profile: null })
          .eq('id', userId),
      );
    }
    setProfileState(null);
  }, [userId]);

  const setActiveWalletId = useCallback(async (id: string) => {
    const selected = wallets.find((wallet) => wallet.id === id);
    if (userId && selected && !selected.readOnly) {
      assertMutation(await supabase.from('wallets').update({ is_active: false }).eq('user_id', userId));
      assertMutation(await supabase.from('wallets').update({ is_active: true }).eq('id', id));
    }
    setActiveWalletIdState(id);
  }, [userId, wallets]);

  const createWallet = useCallback(async (name: string): Promise<Wallet> => {
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await withTimeout(supabase
      .from('wallets')
      .insert({ user_id: userId, name, is_active: wallets.length === 0 })
      .select()
      .single(), 15000, 'Criar a carteira');
    if (error || !data) throw error;
    const w: Wallet = {
      id: data.id,
      name: data.name,
      assets: [],
      createdAt: Date.now(),
      ownerId: userId,
      readOnly: false,
    };
    setWallets((prev) => {
      const next = [...prev, w];
      walletsRef.current = next;
      return next;
    });
    if (wallets.length === 0) setActiveWalletIdState(w.id);
    return w;
  }, [userId, wallets.length]);

  const ensureActiveWallet = useCallback(async (): Promise<Wallet> => {
    if (!userId) throw new Error('Você não está logado. Faça login novamente.');
    const existing = selectOwnedWallet(walletsRef.current, userId, activeWalletId);
    if (existing) {
      if (activeWalletId !== existing.id) setActiveWalletIdState(existing.id);
      return existing;
    }
    if (walletRecoveryRef.current) return walletRecoveryRef.current;
    const recovery = (async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('wallets')
          .insert({ user_id: userId, name: 'Carteira principal', is_active: true })
          .select()
          .single(),
        15000,
        'Preparar sua carteira',
      );
      if (error || !data) throw new Error(translateDbError(error?.message || 'Sem resposta do servidor'));
      const recoveryWallet: Wallet = mapRecoveryWallet(data, userId);
      setWallets((current) => {
        const next = current.some((wallet) => wallet.id === recoveryWallet.id) ? current : [recoveryWallet, ...current];
        walletsRef.current = next;
        return next;
      });
      setActiveWalletIdState(recoveryWallet.id);
      return recoveryWallet;
    })().finally(() => {
      walletRecoveryRef.current = null;
    });
    walletRecoveryRef.current = recovery;
    return recovery;
  }, [activeWalletId, userId]);

  const deleteWallet = useCallback(async (id: string) => {
    const wallet = walletsRef.current.find((item) => item.id === id);
    if (!wallet || wallet.readOnly) throw new Error('Esta carteira compartilhada é somente leitura.');
    const ownedWallets = walletsRef.current.filter((item) => item.ownerId === userId && !item.readOnly);
    let replacement: Wallet | null = null;
    if (ownedWallets.length === 1) {
      const { data, error } = await withTimeout(
        supabase.from('wallets').insert({ user_id: userId, name: 'Carteira principal', is_active: true }).select().single(),
        15000,
        'Preparar a carteira principal',
      );
      if (error || !data) throw new Error(translateDbError(error?.message || 'Sem resposta do servidor'));
      replacement = mapRecoveryWallet(data, userId);
    }
    const { error } = await withTimeout(supabase.from('wallets').delete().eq('id', id), 15000, 'Excluir a carteira');
    if (error) throw new Error(translateDbError(error.message));
    setWallets((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      const next = replacement ? [replacement, ...remaining] : remaining;
      walletsRef.current = next;
      if (activeWalletId === id) setActiveWalletIdState(replacement?.id || selectOwnedWallet(next, userId, null)?.id || next[0]?.id || null);
      return next;
    });
  }, [activeWalletId, userId]);

  const addAsset = useCallback(async (walletId: string, asset: Asset) => {
    if (!userId) throw new Error('Você não está logado. Faça login novamente.');
    const wallet = walletsRef.current.find((item) => item.id === walletId);
    if (!wallet || wallet.readOnly) throw new Error('Esta carteira compartilhada é somente leitura.');
    const existing = wallet.assets.find((a) => a.symbol === asset.symbol);
    if (existing && existing.id) {
      const totalQty = existing.quantity + asset.quantity;
      const avg = (existing.avgPrice * existing.quantity + asset.avgPrice * asset.quantity) / totalQty;
      const { error } = await withTimeout(supabase
        .from('assets')
        .update({ quantity: totalQty, avg_price: avg })
        .eq('id', existing.id), 15000, 'Atualizar o ativo');
      if (error) throw new Error(translateDbError(error.message));
      setWallets((prev) => {
        const next = prev.map((w) =>
          w.id === walletId
            ? {
                ...w,
                assets: w.assets.map((a) =>
                  a.symbol === asset.symbol ? { ...a, quantity: totalQty, avgPrice: avg } : a,
                ),
              }
            : w,
        );
        walletsRef.current = next;
        return next;
      });
    } else {
      const { data, error } = await withTimeout(supabase
        .from('assets')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          quantity: asset.quantity,
          avg_price: asset.avgPrice,
        })
        .select()
        .single(), 15000, 'Salvar o ativo');
      if (error) throw new Error(translateDbError(error.message));
      if (!data) throw new Error('Sem resposta do servidor. Tente de novo.');
      const newAsset: Asset = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        quantity: Number(data.quantity),
        avgPrice: Number(data.avg_price),
        addedAt: new Date(data.added_at).getTime(),
        source: (data.source || 'manual') as 'manual' | 'pluggy',
        pluggyItemId: data.pluggy_item_id ?? null,
        lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at).getTime() : null,
      };
      setWallets((prev) => {
        const next = prev.map((w) => (w.id === walletId ? { ...w, assets: [...w.assets, newAsset] } : w));
        walletsRef.current = next;
        return next;
      });
    }
  }, [userId, wallets]);

  const removeAsset = useCallback(async (walletId: string, symbol: string) => {
    const wallet = walletsRef.current.find((item) => item.id === walletId);
    if (!wallet || wallet.readOnly) throw new Error('Esta carteira compartilhada é somente leitura.');
    const target = wallet.assets.find((a) => a.symbol === symbol);
    if (target?.id) {
      const { error } = await withTimeout(supabase.from('assets').delete().eq('id', target.id), 10000, 'Remover o ativo');
      if (error) throw new Error(translateDbError(error.message));
    }
    setWallets((prev) => {
      const next = prev.map((w) =>
        w.id === walletId ? { ...w, assets: w.assets.filter((a) => a.symbol !== symbol) } : w,
      );
      walletsRef.current = next;
      return next;
    });
  }, []);

  const updateAsset = useCallback(async (walletId: string, symbol: string, patch: Partial<Asset>) => {
    const wallet = walletsRef.current.find((item) => item.id === walletId);
    if (!wallet || wallet.readOnly) throw new Error('Esta carteira compartilhada é somente leitura.');
    const target = wallet.assets.find((a) => a.symbol === symbol);
    if (target?.id) {
      const dbPatch: any = {};
      if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
      if (patch.avgPrice !== undefined) dbPatch.avg_price = patch.avgPrice;
      if (patch.name !== undefined) dbPatch.name = patch.name;
      const { error } = await withTimeout(supabase.from('assets').update(dbPatch).eq('id', target.id), 15000, 'Atualizar o ativo');
      if (error) throw new Error(translateDbError(error.message));
    }
    setWallets((prev) => {
      const next = prev.map((w) =>
        w.id === walletId
          ? { ...w, assets: w.assets.map((a) => (a.symbol === symbol ? { ...a, ...patch } : a)) }
          : w,
      );
      walletsRef.current = next;
      return next;
    });
  }, []);

  const togglePrivacy = useCallback(async () => {
    const next = !privacyMode;
    if (userId) {
      assertMutation(await supabase.from('profiles').update({ privacy_mode: next }).eq('id', userId));
    }
    setPrivacyMode(next);
  }, [privacyMode, userId]);

  const addToWatchlist = useCallback(
    async (item: Omit<WatchlistItem, 'addedAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      const newItem: WatchlistItem = { ...item, addedAt: Date.now() };
      assertMutation(
        await supabase.from('watchlist').upsert({
          user_id: userId,
          symbol: item.symbol,
          name: item.name,
          type: item.type,
          target_price: item.targetPrice ?? null,
        }),
      );
      setWatchlist((prev) => {
        if (prev.some((x) => x.symbol === item.symbol)) return prev;
        return [newItem, ...prev];
      });
    },
    [userId],
  );

  const removeFromWatchlist = useCallback(
    async (symbol: string) => {
      if (userId) {
        assertMutation(
          await supabase.from('watchlist').delete().eq('user_id', userId).eq('symbol', symbol),
        );
      }
      setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
    },
    [userId],
  );

  const setWatchlistTarget = useCallback(
    async (symbol: string, targetPrice: number | null) => {
      if (userId) {
        assertMutation(
          await supabase
            .from('watchlist')
            .update({ target_price: targetPrice })
            .eq('user_id', userId)
            .eq('symbol', symbol),
        );
      }
      setWatchlist((prev) =>
        prev.map((w) => (w.symbol === symbol ? { ...w, targetPrice: targetPrice ?? undefined } : w)),
      );
    },
    [userId],
  );

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.some((w) => w.symbol === symbol),
    [watchlist],
  );

  const recordOperationAndUpdatePosition = useCallback(async (input: AtomicOperationInput) => {
    if (!userId) throw new Error('Você não está logado. Faça login novamente.');
    const wallet = walletsRef.current.find((item) => item.id === input.walletId);
    if (!wallet || wallet.readOnly) throw new Error('Esta carteira compartilhada é somente leitura.');
    await Storage.setRequired(pendingOperationKey(userId), input);
    const { error } = await withTimeout(supabase.rpc('record_operation_and_update_position', {
      p_client_request_id: input.clientRequestId,
      p_payload_hash: input.payloadHash,
      p_wallet_id: input.walletId,
      p_type: input.type,
      p_symbol: input.symbol,
      p_asset_type: input.assetType,
      p_quantity: input.quantity,
      p_price: input.price,
      p_fees: input.fees || 0,
      p_withholding_tax: input.withholdingTax || 0,
      p_date: input.date,
      p_name: input.name || input.symbol,
    }), 15000, 'Salvar a operação');
    if (error) {
      const missingRpc = error.code === 'PGRST202' || /schema cache|record_operation_and_update_position/i.test(error.message || '');
      if (!missingRpc) throw new Error(translateDbError(error.message));

      // Compatibility path while migration 007 propagates. The ledger stores the
      // exact target position, so repeating the same request sets (never adds)
      // that target and cannot double the quantity after a client timeout.
      const marker = 'vesti-operation:';
      const { data: previousRows, error: previousError } = await withTimeout(supabase
        .from('operations')
        .select('id, notes')
        .eq('id', input.clientRequestId)
        .limit(1), 10000, 'Confirmar a operação');
      if (previousError) throw new Error(translateDbError(previousError.message));

      type TargetPosition = { quantity: number; avgPrice: number; name: string; type: Asset['type'] };
      type StoredRequest = { fingerprint: string; target: TargetPosition | null; walletId?: string };
      let stored: StoredRequest | null = null;
      if (previousRows?.[0]?.notes) {
        try {
          stored = JSON.parse(String(previousRows[0].notes).slice(marker.length)) as StoredRequest;
        } catch {
          throw new Error('Não foi possível confirmar a operação anterior. Atualize a tela e tente novamente.');
        }
      }
      if (stored && stored.fingerprint !== input.payloadHash) {
        throw new Error('Esta tentativa pertence a outros dados. Feche e registre uma nova operação.');
      }
      if (!stored) {
        let target: TargetPosition | null = null;
        const { data: assetRows, error: assetError } = await withTimeout(supabase
          .from('assets')
          .select('id, symbol, name, type, quantity, avg_price')
          .eq('wallet_id', input.walletId)
          .eq('user_id', userId)
          .eq('symbol', input.symbol)
          .limit(1), 10000, 'Verificar a posição');
        if (assetError) throw new Error(translateDbError(assetError.message));
        if (input.assetType !== 'daytrade') {
          const current = assetRows?.[0];
          const currentQuantity = Number(current?.quantity || 0);
          const currentAverage = Number(current?.avg_price || 0);
          if (input.type === 'sell' && !current) throw new Error(`Você não possui ${input.symbol} nesta carteira.`);
          if (input.type === 'sell' && input.quantity > currentQuantity) throw new Error(`A venda excede sua posição atual de ${currentQuantity} unidades.`);
          const nextQuantity = input.type === 'buy' ? currentQuantity + input.quantity : currentQuantity - input.quantity;
          const nextAverage = input.type === 'buy'
            ? ((currentAverage * currentQuantity) + (input.price * input.quantity) + (input.fees || 0)) / nextQuantity
            : currentAverage;
          target = {
            quantity: nextQuantity,
            avgPrice: nextQuantity > 0 ? nextAverage : 0,
            name: current?.name || input.name || input.symbol,
            type: (current?.type || input.assetType) as Asset['type'],
          };
        }
        stored = { fingerprint: input.payloadHash, target, walletId: input.walletId };
        const note = `${marker}${JSON.stringify(stored)}`;
        const { error: insertError } = await withTimeout(supabase.from('operations').upsert({
          id: input.clientRequestId,
          user_id: userId,
          type: input.type,
          symbol: input.symbol,
          asset_type: input.assetType,
          quantity: input.quantity,
          price: input.price,
          fees: input.fees || 0,
          withholding_tax: input.withholdingTax || 0,
          date: input.date,
          notes: note,
        }, { onConflict: 'id', ignoreDuplicates: true }), 10000, 'Registrar a operação');
        if (insertError) throw new Error(translateDbError(insertError.message));

        // A concurrent retry may have won the insert. Its payload is authoritative.
        const { data: confirmedRows, error: confirmError } = await withTimeout(supabase
          .from('operations')
          .select('notes')
          .eq('id', input.clientRequestId)
          .limit(1), 10000, 'Confirmar a operação');
        if (confirmError || !confirmedRows?.[0]?.notes) throw new Error(translateDbError(confirmError?.message || 'Operação não confirmada'));
        try {
          stored = JSON.parse(String(confirmedRows[0].notes).slice(marker.length)) as StoredRequest;
        } catch {
          throw new Error('Não foi possível confirmar a operação. Tente novamente.');
        }
        if (stored.fingerprint !== input.payloadHash) throw new Error('Esta tentativa pertence a outros dados. Feche e registre uma nova operação.');
      }

      const target = stored.target;
      if (!target) {
        const { data: { session } } = await supabase.auth.getSession();
        await loadUserData(userId, session?.user?.email || user?.email || '');
        await Storage.removeRequired(pendingOperationKey(userId));
        return;
      }

      const { data: currentRows, error: currentError } = await withTimeout(supabase
        .from('assets')
        .select('id')
        .eq('wallet_id', input.walletId)
        .eq('user_id', userId)
        .eq('symbol', input.symbol)
        .limit(1), 10000, 'Sincronizar a posição');
      if (currentError) throw new Error(translateDbError(currentError.message));
      const currentId = currentRows?.[0]?.id;
      if (target.quantity <= 0 && currentId) {
        const { error: deleteError } = await withTimeout(supabase.from('assets').delete().eq('id', currentId), 10000, 'Sincronizar a venda');
        if (deleteError) throw new Error(translateDbError(deleteError.message));
      } else if (target.quantity > 0 && currentId) {
        const { error: updateError } = await withTimeout(supabase.from('assets').update({ quantity: target.quantity, avg_price: target.avgPrice }).eq('id', currentId), 10000, 'Sincronizar a posição');
        if (updateError) throw new Error(translateDbError(updateError.message));
      } else if (target.quantity > 0) {
        const { error: assetInsertError } = await withTimeout(supabase.from('assets').insert({
          wallet_id: input.walletId,
          user_id: userId,
          symbol: input.symbol,
          name: target.name,
          type: target.type,
          quantity: target.quantity,
          avg_price: target.avgPrice,
        }), 10000, 'Sincronizar a posição');
        if (assetInsertError) throw new Error(translateDbError(assetInsertError.message));
      }
    }
    const { data: { session } } = await supabase.auth.getSession();
    await loadUserData(userId, session?.user?.email || user?.email || '');
    await Storage.removeRequired(pendingOperationKey(userId));
  }, [loadUserData, user?.email, userId]);

  useEffect(() => {
    if (!userId || wallets.length === 0) return;
    let cancelled = false;
    Storage.get<AtomicOperationInput>(pendingOperationKey(userId)).then((pending) => {
      if (!cancelled && pending) {
        recordOperationAndUpdatePosition(pending).catch((error) => console.warn('Pending operation recovery failed', error));
      }
    });
    return () => { cancelled = true; };
  }, [recordOperationAndUpdatePosition, userId, wallets.length]);

  const resolveOperationWallet = useCallback((operation: Operation): Wallet => {
    const editable = walletsRef.current.filter((wallet) => !wallet.readOnly && (!wallet.ownerId || wallet.ownerId === userId));
    if (operation.walletId) {
      const exact = editable.find((wallet) => wallet.id === operation.walletId);
      if (!exact) throw new Error('A carteira deste movimento não está disponível para edição.');
      return exact;
    }
    if (editable.length === 1) return editable[0];
    throw new Error(`O movimento antigo de ${operation.symbol} não informa a carteira e há mais de uma possibilidade. Por segurança, ele não foi alterado.`);
  }, [userId]);

  const mutateOperationAndPosition = useCallback(async (
    previous: Operation,
    action: 'update' | 'delete',
    next?: Operation,
  ) => {
    if (!userId) throw new Error('Não autenticado');
    const wallet = resolveOperationWallet(previous);
    const { error } = await withTimeout(supabase.rpc('mutate_operation_and_rebuild_position', {
      p_operation_id: previous.id,
      p_action: action,
      p_wallet_id: wallet.id,
      p_quantity: next?.quantity ?? null,
      p_price: next?.price ?? null,
      p_fees: next?.fees || 0,
      p_withholding_tax: next?.withholdingTax || 0,
      p_date: next?.date ?? null,
    }), 15000, action === 'delete' ? 'Excluir o movimento' : 'Editar o movimento');
    if (error) {
      const missingRpc = error.code === 'PGRST202' || /schema cache|mutate_operation_and_rebuild_position/i.test(error.message || '');
      if (!missingRpc) throw new Error(translateDbError(error.message));

      // Compatibilidade durante a propagação da migração 008. A reconstrução é
      // cronológica e qualquer falha na posição restaura o ledger anterior.
      const symbol = previous.symbol.toUpperCase();
      const related = operations.filter((operation) =>
        operation.assetType !== 'daytrade'
        && operation.symbol.toUpperCase() === symbol
        && (operation.walletId === wallet.id || !operation.walletId),
      );
      const desired = action === 'delete'
        ? related.filter((operation) => operation.id !== previous.id)
        : related.map((operation) => operation.id === previous.id ? (next as Operation) : operation);
      const current = wallet.assets.find((asset) => asset.symbol.toUpperCase() === symbol);
      const target = previous.assetType === 'daytrade'
        ? null
        : rebuildPositionFromOperations(
            current ? { quantity: current.quantity, avgPrice: current.avgPrice } : { quantity: 0, avgPrice: 0 },
            related,
            desired,
          );
      const dbPatch = next ? {
        wallet_id: wallet.id,
        quantity: next.quantity,
        price: next.price,
        fees: next.fees || 0,
        withholding_tax: next.withholdingTax || 0,
        date: next.date,
      } : null;
      const ledgerMutation = action === 'delete'
        ? supabase.from('operations').delete().eq('id', previous.id).eq('user_id', userId)
        : supabase.from('operations').update(dbPatch!).eq('id', previous.id).eq('user_id', userId);
      const ledgerResult = await withTimeout(ledgerMutation, 15000, action === 'delete' ? 'Excluir o movimento' : 'Editar o movimento');
      if (ledgerResult.error) throw new Error(translateDbError(ledgerResult.error.message));
      try {
        if (target) {
          if (target.quantity <= 0 && current) await removeAsset(wallet.id, current.symbol);
          else if (target.quantity > 0 && current) await updateAsset(wallet.id, current.symbol, { quantity: target.quantity, avgPrice: target.avgPrice });
          else if (target.quantity > 0) await addAsset(wallet.id, {
            symbol: previous.symbol,
            name: previous.symbol,
            type: previous.assetType === 'daytrade' ? 'acao' : previous.assetType,
            quantity: target.quantity,
            avgPrice: target.avgPrice,
            addedAt: Date.now(),
          });
        }
      } catch (positionError) {
        if (action === 'delete') {
          await supabase.from('operations').insert({
            id: previous.id, user_id: userId, wallet_id: wallet.id, type: previous.type,
            symbol: previous.symbol, asset_type: previous.assetType, quantity: previous.quantity,
            price: previous.price, fees: previous.fees || 0, withholding_tax: previous.withholdingTax || 0,
            date: previous.date, notes: previous.notes,
          });
        } else {
          await supabase.from('operations').update({
            wallet_id: previous.walletId || wallet.id, quantity: previous.quantity, price: previous.price,
            fees: previous.fees || 0, withholding_tax: previous.withholdingTax || 0, date: previous.date,
          }).eq('id', previous.id).eq('user_id', userId);
        }
        throw positionError;
      }
    }
    const { data: { session } } = await supabase.auth.getSession();
    await loadUserData(userId, session?.user?.email || user?.email || '');
  }, [addAsset, loadUserData, operations, removeAsset, resolveOperationWallet, updateAsset, user?.email, userId]);

  const updateOperationAndPosition = useCallback(async (id: string, patch: Partial<Pick<Operation, 'quantity' | 'price' | 'fees' | 'withholdingTax' | 'date'>>) => {
    if (!userId) throw new Error('Não autenticado');
    const previous = operations.find((operation) => operation.id === id);
    if (!previous) throw new Error('Movimento não encontrado.');
    const next = { ...previous, ...patch };
    if (next.quantity <= 0 || next.price <= 0) throw new Error('Quantidade e preço precisam ser maiores que zero.');
    await mutateOperationAndPosition(previous, 'update', next);
  }, [mutateOperationAndPosition, operations, userId]);

  const removeOperationAndUpdatePosition = useCallback(async (id: string) => {
    if (!userId) throw new Error('Não autenticado');
    const previous = operations.find((operation) => operation.id === id);
    if (!previous) throw new Error('Movimento não encontrado.');
    await mutateOperationAndPosition(previous, 'delete');
  }, [mutateOperationAndPosition, operations, userId]);

  const addProvento = useCallback(
    async (p: Omit<Provento, 'id' | 'createdAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      const { data, error } = await withTimeout(supabase
        .from('proventos')
        .insert({
          user_id: userId,
          symbol: p.symbol,
          kind: p.kind,
          amount: p.amount,
          per_share: p.perShare,
          date: p.date,
          notes: p.notes,
        })
        .select()
        .single(), 15000, 'Salvar o provento');
      if (error || !data) throw new Error(translateDbError(error?.message || 'Erro'));
      setProventos((prev) => [
        {
          id: data.id,
          symbol: data.symbol,
          kind: data.kind,
          amount: Number(data.amount),
          perShare: data.per_share != null ? Number(data.per_share) : undefined,
          date: data.date,
          notes: data.notes,
          createdAt: new Date(data.created_at).getTime(),
        },
        ...prev,
      ]);
    },
    [userId],
  );

  const removeProvento = useCallback(
    async (id: string) => {
      if (userId) {
        assertMutation(await supabase.from('proventos').delete().eq('id', id));
      }
      setProventos((prev) => prev.filter((p) => p.id !== id));
    },
    [userId],
  );

  const updateUserName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !userId) return;
      assertMutation(await supabase.from('profiles').update({ name: trimmed }).eq('id', userId));
      setUser((prev) => (prev ? { ...prev, name: trimmed } : prev));
    },
    [userId],
  );

  const clearAllUserData = useCallback(async () => {
    if (!userId) return;
    // A carteira de recuperação nasce antes da limpeza. Assim a sessão nunca
    // fica sem destino para um novo ativo, mesmo se a rede oscilar no processo.
    const { data: recoveryRow, error: recoveryError } = await withTimeout(
      supabase
        .from('wallets')
        .insert({ user_id: userId, name: 'Carteira principal', is_active: true })
        .select()
        .single(),
      15000,
      'Reiniciar sua carteira',
    );
    if (recoveryError || !recoveryRow) throw new Error(translateDbError(recoveryError?.message || 'Sem resposta do servidor'));
    const recoveryWallet: Wallet = mapRecoveryWallet(recoveryRow, userId);
    const childResults = await Promise.all([
      supabase.from('assets').delete().eq('user_id', userId),
      supabase.from('operations').delete().eq('user_id', userId),
      supabase.from('proventos').delete().eq('user_id', userId),
      supabase.from('patrimony_snapshots').delete().eq('user_id', userId),
      supabase.from('watchlist').delete().eq('user_id', userId),
      supabase.from('goals_reached').delete().eq('user_id', userId),
      supabase.from('lessons_completed').delete().eq('user_id', userId),
    ]);
    childResults.forEach(assertMutation);
    assertMutation(await withTimeout(
      supabase.from('wallets').delete().eq('user_id', userId).neq('id', recoveryWallet.id),
      15000,
      'Remover carteiras antigas',
    ));
    assertMutation(await withTimeout(
      supabase.from('wallets').update({ is_active: true }).eq('id', recoveryWallet.id),
      15000,
      'Ativar a nova carteira',
    ));
    walletsRef.current = [recoveryWallet];
    setWallets([recoveryWallet]);
    setActiveWalletIdState(recoveryWallet.id);
    setOperations([]);
    setProventos([]);
    setSnapshots([]);
    setWatchlist([]);
    setGoalsReached([]);
    setCompletedLessons({});
  }, [userId]);

  const deleteAccount = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) return { ok: false, error: 'Não autenticado' };
    try {
      // Chama RPC no Supabase que apaga tudo em cascata (dados + audit log).
      const { data, error } = await supabase.rpc('delete_my_account');
      if (error) return { ok: false, error: error.message };
      if (!data?.ok) return { ok: false, error: data?.error || 'Falha ao excluir conta' };
      // A conta já não existe no servidor; a limpeza local não pode transformar
      // uma exclusão concluída em falso erro por causa do token agora inválido.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Erro desconhecido' };
    }
  }, [userId]);

  const recordSnapshot = useCallback(
    async (total: number, invested: number) => {
      if (!userId || total <= 0) return;
      const today = new Date().toISOString().slice(0, 10);
      // Upsert sempre — se já existe snapshot de hoje, ATUALIZA (adicionar ativo
      // no meio do dia deve refletir imediatamente na evolução da carteira).
      const { data, error } = await supabase
        .from('patrimony_snapshots')
        .upsert(
          { user_id: userId, date: today, total, invested },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single();
      if (error) throw new Error(translateDbError(error.message));
      if (!data) throw new Error('Sem resposta do servidor. Tente de novo.');
      setSnapshots((prev) => {
        const without = prev.filter((s) => s.date !== today);
        return [
          ...without,
          { id: data.id, date: data.date, total: Number(data.total), invested: Number(data.invested) },
        ].sort((a, b) => a.date.localeCompare(b.date));
      });
    },
    [userId],
  );

  const markVersionSeen = useCallback(
    async (version: string) => {
      // Persiste TAMBÉM na nuvem (Supabase) pra sobreviver a clear de cache
      // e funcionar entre dispositivos
      if (userId) {
        const updated = { ...(profile || {}), lastSeenVersion: version };
        assertMutation(
          await supabase
            .from('profiles')
            .update({ financial_profile: updated })
            .eq('id', userId),
        );
      }
      await Storage.set(KEYS.LAST_SEEN_VERSION, version);
      setLastSeenVersion(version);
    },
    [userId, profile],
  );

  const recordLesson = useCallback(async (lessonId: string, quizScore: number) => {
    if (userId) {
      assertMutation(
        await supabase
          .from('lessons_completed')
          .upsert({ user_id: userId, lesson_id: lessonId, quiz_score: quizScore }),
      );
    }
    setCompletedLessons((prev) => ({ ...prev, [lessonId]: quizScore }));
  }, [userId]);

  const recordGoal = useCallback(async (value: number) => {
    if (goalsReached.includes(value)) return;
    if (userId) {
      assertMutation(await supabase.from('goals_reached').upsert({ user_id: userId, value }));
    }
    setGoalsReached((prev) => [...prev, value]);
  }, [goalsReached, userId]);

  const activeWallet = wallets.find((w) => w.id === activeWalletId) || null;

  return (
    <AppContext.Provider
      value={{
        loading,
        onboardingDone,
        finishOnboarding,
        user,
        signUp,
        signIn,
        signOut,
        resetPassword,
        passwordRecoveryActive,
        completePasswordRecovery,
        hasPin,
        setPin,
        verifyPin,
        pinLockout,
        pinVerified,
        markPinVerified,
        resetPinSession,
        resetPinWithPassword,
        profile,
        setProfile,
        resetProfile,
        wallets,
        activeWalletId,
        activeWallet,
        setActiveWalletId,
        createWallet,
        ensureActiveWallet,
        deleteWallet,
        addAsset,
        removeAsset,
        updateAsset,
        privacyMode,
        togglePrivacy,
        goalsReached,
        recordGoal,
        completedLessons,
        recordLesson,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        setWatchlistTarget,
        isInWatchlist,
        lastSeenVersion,
        markVersionSeen,
        operations,
        recordOperationAndUpdatePosition,
        updateOperationAndPosition,
        removeOperationAndUpdatePosition,
        proventos,
        addProvento,
        removeProvento,
        snapshots,
        recordSnapshot,
        updateUserName,
        clearAllUserData,
        deleteAccount,
        refreshFromCloud,
        pro: proStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function assertMutation(result: { error?: { message?: string } | null }): void {
  if (result.error) {
    throw new Error(translateDbError(result.error.message || 'Falha ao salvar alteração'));
  }
}

function readOperationWalletId(notes?: string | null): string | undefined {
  if (!notes?.startsWith('vesti-operation:')) return undefined;
  try {
    const value = JSON.parse(notes.slice('vesti-operation:'.length));
    return typeof value?.walletId === 'string' ? value.walletId : undefined;
  } catch {
    return undefined;
  }
}

function translateDbError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('relation') && m.includes('does not exist'))
    return 'As tabelas do banco não foram criadas. Rode o SQL do schema.sql no Supabase.';
  if (m.includes('row-level security') || m.includes('violates row-level security'))
    return 'Permissão negada. Confirme seu email pra liberar acesso ao banco.';
  if (m.includes('jwt expired')) return 'Sessão expirou. Faça login novamente.';
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Sem conexão com o servidor. Verifique sua internet.';
  return `Erro: ${msg}`;
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email ou senha incorretos';
  if (m.includes('email not confirmed')) return 'Confirme seu email antes de entrar. Veja sua caixa de entrada.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Esse email já está cadastrado';
  if (m.includes('password should be')) return 'A senha precisa ter pelo menos 6 caracteres';
  if (m.includes('invalid email')) return 'Email inválido';
  return msg;
}

function getAuthParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  for (const index of [queryIndex, hashIndex]) {
    if (index < 0) continue;
    const end = index === queryIndex && hashIndex > index ? hashIndex : url.length;
    const section = url.slice(index + 1, end);
    new URLSearchParams(section).forEach((value, key) => params.set(key, value));
  }
  return params;
}
