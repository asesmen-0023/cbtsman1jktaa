// 1. URL Utama Supabase (Tanpa '/rest/v1/')
const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co';

// 2. Publishable Key Supabase Anda
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

// 3. Inisialisasi Instance Client Supabase Global
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
