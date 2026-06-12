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
};

export type WatchlistItem = {
  symbol: string;
  name: string;
  type: string;
  targetPrice?: number;
  addedAt: number;
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await loadUserData(session.user.id, session.user.email || '');
      } else {
        setUserId(null);
        setUser(null);
        setProfileState(null);
        setWallets([]);
        setActiveWalletIdState(null);
        setGoalsReached([]);
        setPinVerified(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

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
