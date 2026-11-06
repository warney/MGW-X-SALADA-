import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://zvjancomlonxzzqtwxqj.supabase.co',
  supabasePublishableKey || 'sb_publishable_l0Nnp6_K9s2k4jyQR4m4Wg_6jeKRP38',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const ADMIN_EMAIL = 'warney.fernandes22@gmail.com';
export const PRODUCT_IMAGE_BUCKET = 'product-images';
