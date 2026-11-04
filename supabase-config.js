// 1. BASE URL SUPABASE (Tanpa '/rest/v1/')
const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co';

// 2. ANON KEY PUBLIK
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

// 3. INISIALISASI CLIENT SUPABASE GLOBAL
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
