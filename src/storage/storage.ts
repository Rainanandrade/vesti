import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const Storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v == null) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  async setRequired<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async removeRequired(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {
      // ignore
    }
  },
};

// Web não tem SecureStore — usa AsyncStorage como fallback.
// Em app nativo (iOS/Android) usa criptografia do sistema operacional.
const useFallback = Platform.OS === 'web';

export const Secure = {
  async get(key: string): Promise<string | null> {
    try {
      if (useFallback) {
        return await AsyncStorage.getItem(`secure:${key}`);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (useFallback) {
      await AsyncStorage.setItem(`secure:${key}`, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (useFallback) {
      await AsyncStorage.removeItem(`secure:${key}`);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const KEYS = {
  ONBOARDING_DONE: 'onboarding_done',
  USER: 'user',
  PROFILE: 'profile',
  WALLETS: 'wallets',
  ACTIVE_WALLET: 'active_wallet',
  GOALS_REACHED: 'goals_reached',
  PRIVACY_MODE: 'privacy_mode',
  LAST_SEEN_VERSION: 'last_seen_version',
  // Rate limit local de tentativas de reset de PIN (anti brute-force)
  PIN_RESET_ATTEMPTS: 'pin_reset_attempts',
  PIN_LOCKOUT_PREFIX: 'pin_lockout',
};

export function pinLockoutKey(userId: string): string {
  return `${KEYS.PIN_LOCKOUT_PREFIX}:${userId}`;
}

export const SECURE_KEYS = {
  PASSWORD: 'auth_password',
  PIN: 'auth_pin',
};
