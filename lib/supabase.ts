import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SalarySettlement = {
  id: string;
  year: number;
  month: number;
  base_salary: number;
  target_days: number;
  worked_days: number;
  amount: number;
  settled_at: string;
};

let browserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    browserClient = null;
    return browserClient;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      browserClient = null;
      return browserClient;
    }
  } catch {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}
