// Konfigurasi 3 Server Supabase SMAN 1 Jakarta
const SUPABASE_SERVERS = {
  "X": {
    name: "Kelas X",
    url: "https://ulroqkrnwzzrgkasrqit.supabase.co",
    anonKey: "sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi"
  },
  "XI": {
    name: "Kelas XI",
    url: "https://oypvpmhvkqhuhamjpjnu.supabase.co",
    anonKey: "sb_publishable_H1n_goBAP5xaUrso_sAoWA_F491hDVE"
  },
  "XII": {
    name: "Kelas XII",
    url: "https://uqxzhrdmpplnlfwvlkag.supabase.co",
    anonKey: "sb_publishable_pXrBRuXMyM65VUv_jIC7HQ_hza_4hTJ"
  }
};

// Global active client & server key
window.currentServerKey = localStorage.getItem("CBT_ADMIN_SERVER_KEY") || "X";
window.supabaseClient = null;

// Fungsi untuk mendapatkan / membuat instance client Supabase aktif secara dinamis
function getActiveSupabaseClient() {
  const config = SUPABASE_SERVERS[window.currentServerKey] || SUPABASE_SERVERS["X"];
  
  if (!window.supabaseClient || window.supabaseClient._currentUrl !== config.url) {
    if (window.supabase) {
      window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      window.supabaseClient._currentUrl = config.url;
    } else {
      console.error('SDK Supabase belum terload dari CDN.');
    }
  }
  return window.supabaseClient;
}

// Inisialisasi awal saat script dimuat
getActiveSupabaseClient();
