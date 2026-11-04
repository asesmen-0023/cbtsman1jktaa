// ELEMEN UTAMA
const loginModal = document.getElementById('loginModal');
const dashboardApp = document.getElementById('dashboardApp');
const adminLoginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');

// 1. SISTEM AUTENTIKASI KELOLA LOGIN ADMIN (SESSION LOCK)
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    try {
        // Cek pencocokan username dan password ke tabel 'admins' di Supabase
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', user)
            .eq('password', pass)
            .single();

        if (error || !data) {
            alert('Username atau Password Admin Salah!');
            return;
        }

        // Simpan session login jika cocok
        sessionStorage.setItem('cbt_admin_logged', 'true');
        sessionStorage.setItem('cbt_admin_name', data.nama_proktor);
        
        initDashboard();
    } catch (err) {
        alert('Terjadi kesalahan koneksi ke server: ' + err.message);
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('cbt_admin_logged');
    location.reload();
});

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

// 2. NAVIGASI TAB MENU RESPONSIVE
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

// 3. MONITORING PELANGGARAN REALTIME
async function fetchViolations() {
    const { data } = await supabase.from('violations').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('violationTableBody');
    if (data && data.length > 0) {
        tbody.innerHTML = data.map(v => `
            <tr class="hover:bg-slate-50">
                <td class="p-4 font-mono text-xs">${new Date(v.created_at).toLocaleTimeString()}</td>
                <td class="p-4 font-bold text-slate-700">${v.nisn}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold">${v.student_class}</span></td>
                <td class="p-4"><span class="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-bold">${v.violation_type}</span></td>
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

// 4. MANAJEMEN SOAL (TAMPIL/SEMBUNYI & WAKTU TAYANG)
async function fetchExams() {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('examTableBody');
    if (data) {
        tbody.innerHTML = data.map(e => `
            <tr>
                <td class="p-4 font-bold">${e.student_class}</td>
                <td class="p-4">${e.subject_name}</td>
                <td class="p-4">
                    <button onclick="toggleExamStatus(${e.id}, ${!e.is_active})" class="px-3 py-1 rounded-full text-xs font-bold ${e.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}">
                        ${e.is_active ? 'TAMPIL (AKTIF)' : 'SEMBUNYI (OFF)'}
                    </button>
                </td>
                <td class="p-4 text-xs text-slate-500">
                    ${e.start_time ? new Date(e.start_time).toLocaleString() : 'Langsung'} s/d <br>
                    ${e.end_time ? new Date(e.end_time).toLocaleString() : 'Tidak dibatasi'}
                </td>
                <td class="p-4">
                    <button onclick="deleteExam(${e.id})" class="text-xs text-red-600 hover:underline">Hapus</button>
                </td>
            </tr>
        `).join('');
    }
}

async function toggleExamStatus(id, newStatus) {
    await supabase.from('exams').update({ is_active: newStatus }).eq('id', id);
    fetchExams();
}

async function deleteExam(id) {
    if (confirm('Hapus soal ini?')) {
        await supabase.from('exams').delete().eq('id', id);
        fetchExams();
    }
}

document.getElementById('addExamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const student_class = document.getElementById('inputClass').value;
    const subject_name = document.getElementById('inputSubject').value;
    const form_url = document.getElementById('inputUrl').value;
    const start_time = document.getElementById('inputStartTime').value || null;
    const end_time = document.getElementById('inputEndTime').value || null;

    await supabase.from('exams').insert([{ student_class, subject_name, form_url, start_time, end_time }]);
    document.getElementById('addExamForm').reset();
    fetchExams();
});

// 5. DATABASE SISWA
async function fetchStudents() {
    const { data } = await supabase.from('students').select('*').order('student_class', { ascending: true });
    const tbody = document.getElementById('studentTableBody');
    if (data) {
        tbody.innerHTML = data.map(s => `
            <tr>
                <td class="p-4 font-mono">${s.nisn}</td>
                <td class="p-4 font-semibold">${s.nama}</td>
                <td class="p-4">${s.student_class}</td>
            </tr>
        `).join('');
    }
}

document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nisn = document.getElementById('inputStudentNisn').value;
    const nama = document.getElementById('inputStudentName').value;
    const student_class = document.getElementById('inputStudentClass').value;

    await supabase.from('students').insert([{ nisn, nama, student_class }]);
    document.getElementById('addStudentForm').reset();
    fetchStudents();
});

// 6. HISTORI PENGERJAAN & IZIN RE-TEST
async function fetchHistory() {
    const { data } = await supabase.from('submissions').select('*, exams(subject_name)').order('created_at', { ascending: false });
    const tbody = document.getElementById('historyTableBody');
    if (data) {
        tbody.innerHTML = data.map(h => `
            <tr>
                <td class="p-4 font-mono">${h.nisn}</td>
                <td class="p-4">${h.exams?.subject_name || 'Soal Ujian'}</td>
                <td class="p-4 font-bold text-center">${h.attempt_count} x</td>
                <td class="p-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${h.is_allowed_retest ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
                        ${h.is_allowed_retest ? 'Diizinkan Ulang' : 'Terkunci (Selesai)'}
                    </span>
                </td>
                <td class="p-4">
                    <button onclick="toggleRetestPermission(${h.id}, ${!h.is_allowed_retest})" class="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg">
                        ${h.is_allowed_retest ? 'Kunci Akses' : 'Beri Izin Ulang'}
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

async function toggleRetestPermission(id, newAllowed) {
    await supabase.from('submissions').update({ is_allowed_retest: newAllowed }).eq('id', id);
    fetchHistory();
}

// Inisialisasi awal saat halaman dibuka
document.addEventListener('DOMContentLoaded', checkAuth);
