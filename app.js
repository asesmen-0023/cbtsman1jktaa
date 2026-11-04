// --- ELEMEN DOM UTAMA ---
const loginModal = document.getElementById('loginModal');
const dashboardApp = document.getElementById('dashboardApp');
const adminLoginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');

// --- 1. AUTENTIKASI ADMIN VIA DATABASE SUPABASE ---
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();

        try {
            // Cocokkan username & password ke tabel 'admins'
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', user)
                .eq('password', pass)
                .maybeSingle();

            if (error || !data) {
                alert('Username atau Password Admin Salah!');
                return;
            }

            // Simpan Session Login
            sessionStorage.setItem('cbt_admin_logged', 'true');
            sessionStorage.setItem('cbt_admin_name', data.nama_proktor || 'Proktor SMAN 1 Jakarta');
            
            initDashboard();
        } catch (err) {
            alert('Terjadi kesalahan koneksi ke server: ' + err.message);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('cbt_admin_logged');
        sessionStorage.removeItem('cbt_admin_name');
        location.reload();
    });
}

function checkAuth() {
    if (sessionStorage.getItem('cbt_admin_logged') === 'true') {
        initDashboard();
    }
}

function initDashboard() {
    loginModal.classList.add('hidden');
    dashboardApp.classList.remove('hidden');
    fetchViolations();
    subscribeViolations();
    fetchExams();
    fetchStudents();
    fetchHistory();
}

// --- 2. NAVIGASI TAB MENU SIDEBAR ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    const activeNav = document.getElementById(`nav-${tabName}`);

    if (activeTab) activeTab.classList.remove('hidden');
    if (activeNav) activeNav.classList.add('active');
}

// --- 3. TAB 1: MONITORING PELANGGARAN REALTIME ---
async function fetchViolations() {
    const { data, error } = await supabase
        .from('violations')
        .select('*')
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('violationTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(v => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-mono text-xs text-slate-500">${new Date(v.created_at).toLocaleTimeString('id-ID')} WIB</td>
                <td class="p-4 font-bold text-slate-700">${v.nisn}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold">${v.student_class}</span></td>
                <td class="p-4"><span class="bg-red-100 text-red-800 px-2.5 py-1 rounded-md text-xs font-bold">${v.violation_type}</span></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400">Belum ada pelanggaran terdeteksi</td></tr>`;
    }
}

function subscribeViolations() {
    supabase.channel('realtime:violations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, () => fetchViolations())
        .subscribe();
}

// --- 4. TAB 2: MANAJEMEN SOAL & KONTROL TAYANG ---
async function fetchExams() {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('examTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(e => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-bold">${e.student_class}</td>
                <td class="p-4 font-semibold text-slate-700">${e.subject_name}</td>
                <td class="p-4">
                    <button onclick="toggleExamStatus(${e.id}, ${!e.is_active})" class="px-3 py-1 rounded-full text-xs font-bold transition ${e.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}">
                        ${e.is_active ? 'TAMPIL (AKTIF)' : 'SEMBUNYI (OFF)'}
                    </button>
                </td>
                <td class="p-4 text-xs text-slate-500">
                    ${e.start_time ? new Date(e.start_time).toLocaleString('id-ID') : 'Langsung'} s/d <br>
                    ${e.end_time ? new Date(e.end_time).toLocaleString('id-ID') : 'Tidak dibatasi'}
                </td>
                <td class="p-4">
                    <button onclick="deleteExam(${e.id})" class="text-xs text-red-600 font-semibold hover:underline">Hapus</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada link soal ditambahkan</td></tr>`;
    }
}

async function toggleExamStatus(id, newStatus) {
    await supabase.from('exams').update({ is_active: newStatus }).eq('id', id);
    fetchExams();
}

async function deleteExam(id) {
    if (confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
        await supabase.from('exams').delete().eq('id', id);
        fetchExams();
    }
}

const addExamForm = document.getElementById('addExamForm');
if (addExamForm) {
    addExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const student_class = document.getElementById('inputClass').value.trim();
        const subject_name = document.getElementById('inputSubject').value.trim();
        const form_url = document.getElementById('inputUrl').value.trim();
        const start_time = document.getElementById('inputStartTime').value || null;
        const end_time = document.getElementById('inputEndTime').value || null;

        await supabase.from('exams').insert([{ student_class, subject_name, form_url, start_time, end_time }]);
        addExamForm.reset();
        fetchExams();
    });
}

// --- 5. TAB 3: DATABASE SISWA ---
async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').order('student_class', { ascending: true });
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(s => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-mono font-bold text-slate-700">${s.nisn}</td>
                <td class="p-4 font-semibold">${s.nama}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold">${s.student_class}</span></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-slate-400">Belum ada data siswa</td></tr>`;
    }
}

const addStudentForm = document.getElementById('addStudentForm');
if (addStudentForm) {
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nisn = document.getElementById('inputStudentNisn').value.trim();
        const nama = document.getElementById('inputStudentName').value.trim();
        const student_class = document.getElementById('inputStudentClass').value.trim();

        await supabase.from('students').insert([{ nisn, nama, student_class }]);
        addStudentForm.reset();
        fetchStudents();
    });
}

// --- 6. TAB 4: RIWAYAT PENGERJAAN & IZIN RE-TEST ---
async function fetchHistory() {
    const { data } = await supabase.from('submissions').select('*, exams(subject_name)').order('created_at', { ascending: false });
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(h => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-mono font-bold text-slate-700">${h.nisn}</td>
                <td class="p-4 font-semibold">${h.exams?.subject_name || 'Ujian CBT'}</td>
                <td class="p-4 font-bold text-center">${h.attempt_count} x</td>
                <td class="p-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${h.is_allowed_retest ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
                        ${h.is_allowed_retest ? 'Diizinkan Ulang' : 'Terkunci (Selesai)'}
                    </span>
                </td>
                <td class="p-4">
                    <button onclick="toggleRetestPermission(${h.id}, ${!h.is_allowed_retest})" class="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                        ${h.is_allowed_retest ? 'Kunci Akses' : 'Beri Izin Ulang'}
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada riwayat pengerjaan siswa</td></tr>`;
    }
}

async function toggleRetestPermission(id, newAllowed) {
    await supabase.from('submissions').update({ is_allowed_retest: newAllowed }).eq('id', id);
    fetchHistory();
}

// Inisialisasi awal saat halaman dibuka
document.addEventListener('DOMContentLoaded', checkAuth);
