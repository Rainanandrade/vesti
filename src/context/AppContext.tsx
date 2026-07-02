import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Storage, KEYS, Secure, SECURE_KEYS } from '../storage/storage';
import { Profile } from '../data/profileQuiz';
import { supabase } from '../services/supabase';

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

  hasPin: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  pinVerified: boolean;
  markPinVerified: () => void;
  resetPinSession: () => void;

  profile: Profile | null;
  setProfile: (p: Profile) => Promise<void>;
  resetProfile: () => Promise<void>;

  wallets: Wallet[];
  activeWalletId: string | null;
  activeWallet: Wallet | null;
  setActiveWalletId: (id: string) => Promise<void>;
  createWallet: (name: string) => Promise<Wallet>;
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
  addOperation: (op: Omit<Operation, 'id' | 'createdAt'>) => Promise<void>;
  removeOperation: (id: string) => Promise<void>;

  proventos: Provento[];
  addProvento: (p: Omit<Provento, 'id' | 'createdAt'>) => Promise<void>;
  removeProvento: (id: string) => Promise<void>;

  snapshots: PatrimonySnapshot[];
  recordSnapshot: (total: number, invested: number) => Promise<void>;

  updateUserName: (name: string) => Promise<void>;
  clearAllUserData: () => Promise<void>;
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
  date: string;          // YYYY-MM-DD
  notes?: string;
  createdAt: number;
};

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
    const { data: wts } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    const { data: ats } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', uid);

    if (wts) {
      const walletList: Wallet[] = wts.map((w: any) => ({
        id: w.id,
        name: w.name,
        createdAt: new Date(w.created_at).getTime(),
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
      setWallets(walletList);
      const active = wts.find((w: any) => w.is_active);
      setActiveWalletIdState(active?.id || walletList[0]?.id || null);
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
    const { data: ops } = await supabase
      .from('operations')
      .select('id, type, symbol, asset_type, quantity, price, date, notes, created_at')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (ops) {
      setOperations(
        ops.map((o: any) => ({
          id: o.id,
          type: o.type,
          symbol: o.symbol,
          assetType: o.asset_type,
          quantity: Number(o.quantity),
          price: Number(o.price),
          date: o.date,
          notes: o.notes,
          createdAt: new Date(o.created_at).getTime(),
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
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const proStatus: ProStatus = (() => {
    const now = Date.now();
    if (!proExpiresAt) return { isPro: false, isTrial: false, isPaid: false, daysLeft: null, expiresAt: null };
    const isPro = proExpiresAt > now;
    const daysLeft = Math.max(0, Math.ceil((proExpiresAt - now) / (24 * 60 * 60 * 1000)));
    return {
      isPro,
      isPaid: isPro && isPaidSubscriber,
      isTrial: isPro && !isPaidSubscriber,
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
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { ok: false, error: friendlyError(error.message) };
    return { ok: true };
  }, []);

  const setPin = useCallback(async (pin: string) => {
    await Secure.set(SECURE_KEYS.PIN, pin);
    setHasPin(true);
    setPinVerified(true);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await Secure.get(SECURE_KEYS.PIN);
    return stored === pin;
  }, []);

  const markPinVerified = useCallback(() => setPinVerified(true), []);
  const resetPinSession = useCallback(() => setPinVerified(false), []);

  const setProfile = useCallback(async (p: Profile) => {
    setProfileState(p);
    if (userId) {
      // upsert garante criação caso o trigger não tenha rodado
      await supabase.from('profiles').upsert(
        { id: userId, name: user?.name || 'Usuário', financial_profile: p, onboarding_done: true },
        { onConflict: 'id' },
      );
    }
  }, [userId, user]);

  const resetProfile = useCallback(async () => {
    // Apaga financial_profile mas mantém o user
    setProfileState(null);
    if (userId) {
      await supabase
        .from('profiles')
        .update({ financial_profile: null })
        .eq('id', userId);
    }
  }, [userId]);

  const setActiveWalletId = useCallback(async (id: string) => {
    setActiveWalletIdState(id);
    if (userId) {
      await supabase.from('wallets').update({ is_active: false }).eq('user_id', userId);
      await supabase.from('wallets').update({ is_active: true }).eq('id', id);
    }
  }, [userId]);

  const createWallet = useCallback(async (name: string): Promise<Wallet> => {
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId, name, is_active: wallets.length === 0 })
      .select()
      .single();
    if (error || !data) throw error;
    const w: Wallet = { id: data.id, name: data.name, assets: [], createdAt: Date.now() };
    setWallets((prev) => [...prev, w]);
    if (wallets.length === 0) setActiveWalletIdState(w.id);
    return w;
  }, [userId, wallets.length]);

  const deleteWallet = useCallback(async (id: string) => {
    await supabase.from('wallets').delete().eq('id', id);
    setWallets((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (activeWalletId === id) setActiveWalletIdState(next[0]?.id || null);
      return next;
    });
  }, [activeWalletId]);

  const addAsset = useCallback(async (walletId: string, asset: Asset) => {
    if (!userId) throw new Error('Você não está logado. Faça login novamente.');
    const existing = wallets.find((w) => w.id === walletId)?.assets.find((a) => a.symbol === asset.symbol);
    if (existing && existing.id) {
      const totalQty = existing.quantity + asset.quantity;
      const avg = (existing.avgPrice * existing.quantity + asset.avgPrice * asset.quantity) / totalQty;
      const { error } = await supabase
        .from('assets')
        .update({ quantity: totalQty, avg_price: avg })
        .eq('id', existing.id);
      if (error) throw new Error(translateDbError(error.message));
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId
            ? {
                ...w,
                assets: w.assets.map((a) =>
                  a.symbol === asset.symbol ? { ...a, quantity: totalQty, avgPrice: avg } : a,
                ),
              }
            : w,
        ),
      );
    } else {
      const { data, error } = await supabase
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
        .single();
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
      setWallets((prev) =>
        prev.map((w) => (w.id === walletId ? { ...w, assets: [...w.assets, newAsset] } : w)),
      );
    }
  }, [userId, wallets]);

  const removeAsset = useCallback(async (walletId: string, symbol: string) => {
    const target = wallets.find((w) => w.id === walletId)?.assets.find((a) => a.symbol === symbol);
    if (target?.id) {
      const { error } = await supabase.from('assets').delete().eq('id', target.id);
      if (error) throw new Error(translateDbError(error.message));
    }
    setWallets((prev) =>
      prev.map((w) =>
        w.id === walletId ? { ...w, assets: w.assets.filter((a) => a.symbol !== symbol) } : w,
      ),
    );
  }, [wallets]);

  const updateAsset = useCallback(async (walletId: string, symbol: string, patch: Partial<Asset>) => {
    const target = wallets.find((w) => w.id === walletId)?.assets.find((a) => a.symbol === symbol);
    if (target?.id) {
      const dbPatch: any = {};
      if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
      if (patch.avgPrice !== undefined) dbPatch.avg_price = patch.avgPrice;
      if (patch.name !== undefined) dbPatch.name = patch.name;
      const { error } = await supabase.from('assets').update(dbPatch).eq('id', target.id);
      if (error) throw new Error(translateDbError(error.message));
    }
    setWallets((prev) =>
      prev.map((w) =>
        w.id === walletId
          ? { ...w, assets: w.assets.map((a) => (a.symbol === symbol ? { ...a, ...patch } : a)) }
          : w,
      ),
    );
  }, [wallets]);

  const togglePrivacy = useCallback(async () => {
    const next = !privacyMode;
    setPrivacyMode(next);
    if (userId) await supabase.from('profiles').update({ privacy_mode: next }).eq('id', userId);
  }, [privacyMode, userId]);

  const addToWatchlist = useCallback(
    async (item: Omit<WatchlistItem, 'addedAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      const newItem: WatchlistItem = { ...item, addedAt: Date.now() };
      setWatchlist((prev) => {
        if (prev.some((x) => x.symbol === item.symbol)) return prev;
        return [newItem, ...prev];
      });
      const { error } = await supabase.from('watchlist').upsert({
        user_id: userId,
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        target_price: item.targetPrice ?? null,
      });
      if (error) throw new Error(translateDbError(error.message));
    },
    [userId],
  );

  const removeFromWatchlist = useCallback(
    async (symbol: string) => {
      setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
      if (userId) {
        await supabase.from('watchlist').delete().eq('user_id', userId).eq('symbol', symbol);
      }
    },
    [userId],
  );

  const setWatchlistTarget = useCallback(
    async (symbol: string, targetPrice: number | null) => {
      setWatchlist((prev) =>
        prev.map((w) => (w.symbol === symbol ? { ...w, targetPrice: targetPrice ?? undefined } : w)),
      );
      if (userId) {
        await supabase
          .from('watchlist')
          .update({ target_price: targetPrice })
          .eq('user_id', userId)
          .eq('symbol', symbol);
      }
    },
    [userId],
  );

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.some((w) => w.symbol === symbol),
    [watchlist],
  );

  const addOperation = useCallback(
    async (op: Omit<Operation, 'id' | 'createdAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('operations')
        .insert({
          user_id: userId,
          type: op.type,
          symbol: op.symbol,
          asset_type: op.assetType,
          quantity: op.quantity,
          price: op.price,
          date: op.date,
          notes: op.notes,
        })
        .select()
        .single();
      if (error || !data) throw new Error(translateDbError(error?.message || 'Erro'));
      const newOp: Operation = {
        id: data.id,
        type: data.type,
        symbol: data.symbol,
        assetType: data.asset_type,
        quantity: Number(data.quantity),
        price: Number(data.price),
        date: data.date,
        notes: data.notes,
        createdAt: new Date(data.created_at).getTime(),
      };
      setOperations((prev) => [newOp, ...prev]);
    },
    [userId],
  );

  const removeOperation = useCallback(
    async (id: string) => {
      setOperations((prev) => prev.filter((o) => o.id !== id));
      if (userId) {
        await supabase.from('operations').delete().eq('id', id);
      }
    },
    [userId],
  );

  const addProvento = useCallback(
    async (p: Omit<Provento, 'id' | 'createdAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      const { data, error } = await supabase
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
        .single();
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
      setProventos((prev) => prev.filter((p) => p.id !== id));
      if (userId) {
        await supabase.from('proventos').delete().eq('id', id);
      }
    },
    [userId],
  );

  const updateUserName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !userId) return;
      setUser((prev) => (prev ? { ...prev, name: trimmed } : prev));
      await supabase.from('profiles').update({ name: trimmed }).eq('id', userId);
    },
    [userId],
  );

  const clearAllUserData = useCallback(async () => {
    if (!userId) return;
    // Apaga tudo do usuário (carteiras, ativos, operações, proventos, snapshots,
    // watchlist, metas, lições). O profile e auth.user permanecem.
    await Promise.all([
      supabase.from('assets').delete().eq('user_id', userId),
      supabase.from('wallets').delete().eq('user_id', userId),
      supabase.from('operations').delete().eq('user_id', userId),
      supabase.from('proventos').delete().eq('user_id', userId),
      supabase.from('patrimony_snapshots').delete().eq('user_id', userId),
      supabase.from('watchlist').delete().eq('user_id', userId),
      supabase.from('goals_reached').delete().eq('user_id', userId),
      supabase.from('lessons_completed').delete().eq('user_id', userId),
    ]);
    setWallets([]);
    setActiveWalletIdState(null);
    setOperations([]);
    setProventos([]);
    setSnapshots([]);
    setWatchlist([]);
    setGoalsReached([]);
    setCompletedLessons({});
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
      if (error || !data) return;
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
      await Storage.set(KEYS.LAST_SEEN_VERSION, version);
      setLastSeenVersion(version);
      // Persiste TAMBÉM na nuvem (Supabase) pra sobreviver a clear de cache
      // e funcionar entre dispositivos
      if (userId) {
        try {
          const updated = { ...(profile || {}), lastSeenVersion: version };
          await supabase
            .from('profiles')
            .update({ financial_profile: updated })
            .eq('id', userId);
        } catch (err) {
          console.warn('failed to persist version online', err);
        }
      }
    },
    [userId, profile],
  );

  const recordLesson = useCallback(async (lessonId: string, quizScore: number) => {
    setCompletedLessons((prev) => ({ ...prev, [lessonId]: quizScore }));
    if (userId) {
      await supabase
        .from('lessons_completed')
        .upsert({ user_id: userId, lesson_id: lessonId, quiz_score: quizScore });
    }
  }, [userId]);

  const recordGoal = useCallback(async (value: number) => {
    if (goalsReached.includes(value)) return;
    setGoalsReached((prev) => [...prev, value]);
    if (userId) {
      await supabase.from('goals_reached').upsert({ user_id: userId, value });
    }
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
        hasPin,
        setPin,
        verifyPin,
        pinVerified,
        markPinVerified,
        resetPinSession,
        profile,
        setProfile,
        resetProfile,
        wallets,
        activeWalletId,
        activeWallet,
        setActiveWalletId,
        createWallet,
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
        addOperation,
        removeOperation,
        proventos,
        addProvento,
        removeProvento,
        snapshots,
        recordSnapshot,
        updateUserName,
        clearAllUserData,
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
