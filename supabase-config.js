// GANTI DENGAN URL & ANON KEY DARI DASHBOARD SUPABASE ANDA
const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

// Inisialisasi Client Supabase Global
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
