import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYXJkaWdleWJzenVrbndpeG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM5NzcsImV4cCI6MjA5NTc2OTk3N30.ETMwaGfujbRCwje8L401am6xnM0EX-B1vvb4EFTLUxQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type DBProfile = {
  id: string;
  name: string;
  financial_profile: any;
  privacy_mode: boolean;
  onboarding_done: boolean;
};

export type DBWallet = {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type DBAsset = {
  id: string;
  wallet_id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'acao' | 'fii' | 'etf' | 'tesouro' | 'cdb' | 'outro';
  quantity: number;
  avg_price: number;
  added_at: string;
};
