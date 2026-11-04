// 1. URL Utama Supabase (Tanpa '/rest/v1/')
const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co';

// 2. Publishable / Anon Key Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

// 3. Inisialisasi Instance Client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
