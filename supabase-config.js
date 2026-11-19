// Konfigurasi 3 Server Supabase SMAN 1 Jakarta
const SUPABASE_SERVERS = {
  "X": {
    name: "Kelas X",
    url: "https://vztlpnuzoatqfufhahxc.supabase.co",
    anonKey: "sb_publishable_uQ5DBKhfiPupfH6U9Mat-A_T9Dvz67s"
  },
  "XI": {
    name: "Kelas XI",
    url = "https://ddarscvwzzfosjrvcxfj.supabase.co",
    anonKey = "sb_publishable_E2tTQ18Vv9Dhlh1vGWBsSw_r9beO-7h"
  },
  "XII": {
    name: "Kelas XII",
    url = "https://vgatmagwhgwvqxsnlwmw.supabase.co",
    anonKey = "sb_publishable_5L8wMYxeuVkO-bXqeoOCaQ_oxQfRzHF"
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
      window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        global: {
          headers: { 'x-cbt-version': '2' }
        }
      });
      window.supabaseClient._currentUrl = config.url;
    } else {
      console.error('SDK Supabase belum terload dari CDN.');
    }
  }
  return window.supabaseClient;
}

// Inisialisasi awal saat script dimuat
getActiveSupabaseClient();
