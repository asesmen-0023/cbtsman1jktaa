// Pembantu instansiasi Supabase secara aman
const getSupabase = () => window.supabaseClient || (window.supabase ? window.supabase.createClient('https://ulroqkrnwzzrgkasrqit.supabase.co', 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi') : null);

// ELEMEN DOM LOG IN
const loginModal = document.getElementById('loginModal');
const dashboardApp = document.getElementById('dashboardApp');
const adminLoginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();

        const client = getSupabase();
        if (!client) {
            alert('Koneksi Supabase belum siap!');
            return;
        }

        try {
            const { data, error } = await client
                .from('admins')
                .select('*')
                .eq('username', user)
                .eq('password', pass)
                .maybeSingle();

            if (error || !data) {
                alert('Username atau Password Admin Salah!');
                return;
            }

            sessionStorage.setItem('cbt_admin_logged', 'true');
            sessionStorage.setItem('cbt_admin_name', data.nama_proktor || 'Proktor SMAN 1 Jakarta');
            initDashboard();
        } catch (err) {
            alert('Terjadi kesalahan koneksi: ' + err.message);
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
    if (loginModal) loginModal.classList.add('hidden');
    if (dashboardApp) dashboardApp.classList.remove('hidden');
    
    // Memuat seluruh data backend saat dashboard terbuka
    fetchGlobalSettings();
    fetchViolations();
    subscribeViolations();
    fetchExams();
    fetchStudents();
    fetchHistory();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active', 'bg-slate-800'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    const activeNav = document.getElementById(`nav-${tabName}`);

    if (activeTab) activeTab.classList.remove('hidden');
    if (activeNav) activeNav.classList.add('active', 'bg-slate-800');
}

function closeEditModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
}

// ==========================================
// 0. PENGATURAN GLOBAL TERPUSAT
// ==========================================
async function fetchGlobalSettings() {
    const client = getSupabase();
    if (!client) return;

    const { data } = await client.from('app_settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
        const inputEnter = document.getElementById('globalEnterPassword');
        const inputExit = document.getElementById('globalExitPassword');
        const inputBright = document.getElementById('globalBrightness');
        const inputVol = document.getElementById('globalVolume');

        if (inputEnter) inputEnter.value = data.enter_password || '12345';
        if (inputExit) inputExit.value = data.exit_password || '123456';
        if (inputBright) inputBright.value = data.screen_brightness || 100;
        if (inputVol) inputVol.value = data.sound_volume || 100;
    }
}

async function saveGlobalSettings() {
    const client = getSupabase();
    if (!client) return;

    const enter_password = document.getElementById('globalEnterPassword').value.trim() || '12345';
    const exit_password = document.getElementById('globalExitPassword').value.trim() || '123456';
    const screen_brightness = parseInt(document.getElementById('globalBrightness').value) || 100;
    const sound_volume = parseInt(document.getElementById('globalVolume').value) || 100;

    const { error } = await client.from('app_settings').upsert({
        id: 1,
        enter_password,
        exit_password,
        screen_brightness,
        sound_volume,
        updated_at: new Date()
    });

    if (!error) {
        alert('Pengaturan Global CBT Berhasil Diperbarui!');
    } else {
        alert('Gagal menyimpan pengaturan: ' + error.message);
    }
}

// ==========================================
// 1. MONITORING PELANGGARAN
// ==========================================
async function fetchViolations() {
    const client = getSupabase();
    if (!client) return;

    const { data } = await client.from('violations').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('violationTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(v => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-mono text-xs text-slate-500">${new Date(v.created_at).toLocaleTimeString('id-ID')} WIB</td>
                <td class="p-4 font-bold text-slate-700">${v.nisn}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold">${v.student_class}</span></td>
                <td class="p-4"><span class="bg-red-100 text-red-800 px-2.5 py-1 rounded-md text-xs font-bold">${v.violation_type}</span></td>
                <td class="p-4">
                    <button onclick="deleteViolation(${v.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada pelanggaran terdeteksi</td></tr>`;
    }
}

async function deleteViolation(id) {
    if (confirm('Hapus log pelanggaran ini?')) {
        const client = getSupabase();
        if (!client) return;
        await client.from('violations').delete().eq('id', id);
        fetchViolations();
    }
}

async function deleteAllViolations() {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA log pelanggaran?')) {
        const client = getSupabase();
        if (!client) return;
        
        const { error } = await client.from('violations').delete().neq('id', 0);
        if (!error) {
            alert('Semua data pelanggaran berhasil dibersihkan.');
            fetchViolations();
        } else {
            alert('Gagal menghapus data: ' + error.message);
        }
    }
}

function subscribeViolations() {
    const client = getSupabase();
    if (!client) return;

    client.channel('realtime:violations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'violations' }, () => fetchViolations())
        .subscribe();
}

// ==========================================
// 2. MANAJEMEN SOAL
// ==========================================
async function fetchExams() {
    const client = getSupabase();
    if (!client) return;

    const { data } = await client.from('exams').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('examTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(e => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-bold text-slate-700">${e.student_class}</td>
                <td class="p-4 font-semibold text-slate-700">${e.subject_name}</td>
                <td class="p-4">
                    <button onclick="toggleExamStatus(${e.id}, ${!e.is_active})" class="px-3 py-1.5 rounded-full text-xs font-bold transition ${e.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}">
                        ${e.is_active ? '🟢 TAMPIL (AKTIF)' : '🔴 DISEMBUNYIKAN'}
                    </button>
                </td>
                <td class="p-4 text-xs text-slate-500">
                    ${e.start_time ? new Date(e.start_time).toLocaleString('id-ID') : 'Langsung'} s/d <br>
                    ${e.end_time ? new Date(e.end_time).toLocaleString('id-ID') : 'Tidak dibatasi'}
                </td>
                <td class="p-4 space-x-2">
                    <button onclick='openEditExamModal(${JSON.stringify(e)})' class="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">Edit</button>
                    <button onclick="deleteExam(${e.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Hapus</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada link soal ditambahkan</td></tr>`;
    }
}

async function toggleExamStatus(id, newStatus) {
    const client = getSupabase();
    if (!client) return;
    await client.from('exams').update({ is_active: newStatus }).eq('id', id);
    fetchExams();
}

async function deleteExam(id) {
    if (confirm('Hapus soal ini?')) {
        const client = getSupabase();
        if (!client) return;
        await client.from('exams').delete().eq('id', id);
        fetchExams();
    }
}

function openEditExamModal(exam) {
    document.getElementById('editExamId').value = exam.id;
    document.getElementById('editClass').value = exam.student_class;
    document.getElementById('editSubject').value = exam.subject_name;
    document.getElementById('editUrl').value = exam.form_url;
    document.getElementById('editStartTime').value = exam.start_time ? exam.start_time.slice(0, 16) : '';
    document.getElementById('editEndTime').value = exam.end_time ? exam.end_time.slice(0, 16) : '';
    document.getElementById('editExamModal').classList.remove('hidden');
}

document.getElementById('editExamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = getSupabase();
    if (!client) return;

    const id = document.getElementById('editExamId').value;
    const student_class = document.getElementById('editClass').value.trim();
    const subject_name = document.getElementById('editSubject').value.trim();
    const form_url = document.getElementById('editUrl').value.trim();
    const start_time = document.getElementById('editStartTime').value || null;
    const end_time = document.getElementById('editEndTime').value || null;

    const { error } = await client.from('exams').update({ student_class, subject_name, form_url, start_time, end_time }).eq('id', id);
    if (!error) {
        closeEditModal('editExamModal');
        fetchExams();
    } else {
        alert('Gagal mengupdate soal: ' + error.message);
    }
});

const addExamForm = document.getElementById('addExamForm');
if (addExamForm) {
    addExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const client = getSupabase();
        if (!client) return;

        const student_class = document.getElementById('inputClass').value.trim();
        const subject_name = document.getElementById('inputSubject').value.trim();
        const form_url = document.getElementById('inputUrl').value.trim();
        const start_time = document.getElementById('inputStartTime').value || null;
        const end_time = document.getElementById('inputEndTime').value || null;

        await client.from('exams').insert([{ student_class, subject_name, form_url, start_time, end_time, is_active: true }]);
        addExamForm.reset();
        fetchExams();
    });
}

// ==========================================
// 3. DATABASE SISWA
// ==========================================
async function fetchStudents() {
    const client = getSupabase();
    if (!client) return;

    const { data } = await client.from('students').select('*').order('student_class', { ascending: true });
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(s => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-mono font-bold text-slate-700">${s.nisn}</td>
                <td class="p-4 font-semibold">${s.nama}</td>
                <td class="p-4"><span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold">${s.student_class}</span></td>
                <td class="p-4 font-mono text-xs text-slate-500">${s.password || '<i class="text-slate-300">Sama dengan NISN</i>'}</td>
                <td class="p-4 space-x-2">
                    <button onclick='openEditStudentModal(${JSON.stringify(s)})' class="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">Edit</button>
                    <button onclick="deleteStudent(${s.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Hapus</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada data siswa</td></tr>`;
    }
}

async function deleteStudent(id) {
    if (confirm('Hapus data siswa ini?')) {
        const client = getSupabase();
        if (!client) return;
        await client.from('students').delete().eq('id', id);
        fetchStudents();
    }
}

function openEditStudentModal(s) {
    document.getElementById('editStudentId').value = s.id;
    document.getElementById('editStudentNisn').value = s.nisn;
    document.getElementById('editStudentName').value = s.nama;
    document.getElementById('editStudentClass').value = s.student_class;
    document.getElementById('editStudentPassword').value = s.password || '';
    document.getElementById('editStudentModal').classList.remove('hidden');
}

document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = getSupabase();
    if (!client) return;

    const id = document.getElementById('editStudentId').value;
    const nama = document.getElementById('editStudentName').value.trim();
    const student_class = document.getElementById('editStudentClass').value.trim();
    const password = document.getElementById('editStudentPassword').value.trim() || null;

    const { error } = await client.from('students').update({ nama, student_class, password }).eq('id', id);
    if (!error) {
        closeEditModal('editStudentModal');
        fetchStudents();
    } else {
        alert('Gagal mengupdate siswa: ' + error.message);
    }
});

const addStudentForm = document.getElementById('addStudentForm');
if (addStudentForm) {
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const client = getSupabase();
        if (!client) return;

        const nisn = document.getElementById('inputStudentNisn').value.trim();
        const nama = document.getElementById('inputStudentName').value.trim();
        const student_class = document.getElementById('inputStudentClass').value.trim();
        const password = document.getElementById('inputStudentPassword').value.trim() || null;

        await client.from('students').insert([{ nisn, nama, student_class, password }]);
        addStudentForm.reset();
        fetchStudents();
    });
}

function downloadExcelTemplate() {
    const templateData = [
        { NISN: "0012345678", NAMA: "Ahmad Bagus", KELAS: "X-1", PASSWORD: "" },
        { NISN: "0087654321", NAMA: "Siti Rahma", KELAS: "XI-2", PASSWORD: "pass123(Opsional)" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Format_Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_CBT.xlsx");
}

async function handleExcelImport() {
    const fileInput = document.getElementById('excelFileInput');
    if (!fileInput.files.length) return alert('Silakan pilih file Excel terlebih dahulu!');

    const client = getSupabase();
    if (!client) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (!jsonData.length) return alert('File Excel kosong atau format tidak sesuai!');

            const formattedStudents = jsonData.map(item => ({
                nisn: String(item.NISN || item.nisn || '').trim(),
                nama: String(item.NAMA || item.nama || '').trim(),
                student_class: String(item.KELAS || item.student_class || '').trim(),
                password: item.PASSWORD || item.password ? String(item.PASSWORD || item.password).trim() : null
            })).filter(s => s.nisn && s.nama && s.student_class);

            if (!formattedStudents.length) return alert('Tidak ada data valid yang ditemukan pada kolom NISN, NAMA, dan KELAS.');

            const { error } = await client.from('students').upsert(formattedStudents, { onConflict: 'nisn' });
            if (!error) {
                alert(`Berhasil mengimpor/memperbarui ${formattedStudents.length} data siswa!`);
                fileInput.value = '';
                fetchStudents();
            } else {
                alert('Gagal mengimpor ke database: ' + error.message);
            }
        } catch (err) {
            alert('Kesalahan saat membaca file Excel: ' + err.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

// ==========================================
// 4. RIWAYAT PENGERJAAN SISWA
// ==========================================
async function fetchHistory() {
    const client = getSupabase();
    if (!client) return;

    const { data } = await client.from('submissions').select('*, exams(subject_name)').order('created_at', { ascending: false });
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (data && data.length > 0) {
        tbody.innerHTML = data.map(h => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-mono font-bold text-slate-700">${h.nisn}</td>
                <td class="p-4 font-semibold">${h.exams?.subject_name || 'Ujian CBT'}</td>
                <td class="p-4 font-bold text-center">${h.attempt_count} x</td>
                <td class="p-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${h.is_allowed_retest ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}">
                        ${h.is_allowed_retest ? 'Diizinkan Ulang' : 'Terkunci (Selesai)'}
                    </span>
                </td>
                <td class="p-4 space-x-2">
                    <button onclick="toggleRetestPermission(${h.id}, ${!h.is_allowed_retest})" class="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                        ${h.is_allowed_retest ? 'Kunci Akses' : 'Beri Izin Ulang'}
                    </button>
                    <button onclick="deleteSubmission(${h.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada riwayat pengerjaan siswa</td></tr>`;
    }
}

async function deleteSubmission(id) {
    if (confirm('Hapus riwayat pengerjaan siswa ini? Siswa akan dapat mengerjakan ulang dari awal.')) {
        const client = getSupabase();
        if (!client) return;
        await client.from('submissions').delete().eq('id', id);
        fetchHistory();
    }
}

async function deleteAllSubmissions() {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat pengerjaan siswa?')) {
        const client = getSupabase();
        if (!client) return;

        const { error } = await client.from('submissions').delete().neq('id', 0);
        if (!error) {
            alert('Semua riwayat pengerjaan berhasil dibersihkan.');
            fetchHistory();
        } else {
            alert('Gagal menghapus data: ' + error.message);
        }
    }
}

async function toggleRetestPermission(id, newAllowed) {
    const client = getSupabase();
    if (!client) return;
    await client.from('submissions').update({ is_allowed_retest: newAllowed }).eq('id', id);
    fetchHistory();
}

document.addEventListener('DOMContentLoaded', checkAuth);
