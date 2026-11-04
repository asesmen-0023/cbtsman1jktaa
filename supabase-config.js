const SUPABASE_URL = 'https://ulroqkrnwzzrgkasrqit.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi';

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('SDK Supabase belum terload dari CDN.');
}
