// URL Base Utama Supabase
const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co';

// Publishable Key Publik
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

// Inisialisasi Client Global
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
