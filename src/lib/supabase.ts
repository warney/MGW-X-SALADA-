import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {})) as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zvjancomlonxzzqtwxqj.supabase.co';
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_l0Nnp6_K9s2k4jyQR4m4Wg_6jeKRP38';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const SUPER_ADMIN_EMAIL = 'warney.fernandes22@gmail.com';
export const SUPER_ADMIN_UUID = '9ea5631d-5045-480b-bd77-8d2ca50c6222';
export const ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
export const PRODUCT_IMAGE_BUCKET = 'product-images';

