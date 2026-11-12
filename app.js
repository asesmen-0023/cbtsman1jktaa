// Pembantu instansiasi Supabase secara dinamis mengikuti server aktif
const getSupabase = () => {
    return typeof getActiveSupabaseClient === 'function' 
        ? getActiveSupabaseClient() 
        : (window.supabaseClient || (window.supabase ? window.supabase.createClient('https://ulroqkrnwzzrgkasrqit.supabase.co', 'sb_publishable_DJm-HRJpia9X3CzOlBq61Q_Dqct-DPi') : null));
};

// Handler untuk berganti server dari dropdown UI
function switchAdminServer(serverKey) {
    window.currentServerKey = serverKey;
    localStorage.setItem("CBT_ADMIN_SERVER_KEY", serverKey);
    window.supabaseClient = null; // Clear instance agar re-connect ke server baru
    
    // Muat ulang data dashboard sesuai server yang dipilih
    initDashboard();
    
    const serverName = (typeof SUPABASE_SERVERS !== 'undefined' && SUPABASE_SERVERS[serverKey]) 
        ? SUPABASE_SERVERS[serverKey].name 
        : serverKey;
        
    showModernAlert(`Berhasil beralih ke Database Server ${serverName}`, 'Server Berkelanjutan', 'success');
}

// ELEMEN DOM LOG IN & UI
const loginModal = document.getElementById('loginModal');
const dashboardApp = document.getElementById('dashboardApp');
const adminLoginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');

// ==========================================
// UTILITY DIALOG MODERN & KUSTOM
// ==========================================
function showModernAlert(message, title = 'Informasi', type = 'info') {
    const existing = document.getElementById('modernAlertModal');
    if (existing) existing.remove();

    let iconBg = 'bg-blue-100 text-blue-600';
    let iconSymbol = 'ℹ️';

    if (type === 'error') {
        iconBg = 'bg-rose-100 text-rose-600';
        iconSymbol = '⚠️';
    } else if (type === 'success') {
        iconBg = 'bg-emerald-100 text-emerald-600';
        iconSymbol = '✅';
    }

    const modalHtml = `
    <div id="modernAlertModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] transition-opacity duration-200">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 transform scale-100 transition-transform">
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center font-bold text-lg">
                    ${iconSymbol}
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 text-base">${title}</h3>
                </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">${message}</p>
            <button onclick="closeModernModal('modernAlertModal')" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm transition">
                Mengerti
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showModernConfirm(message, title = 'Konfirmasi Tindakan', onConfirm) {
    const existing = document.getElementById('modernConfirmModal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="modernConfirmModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] transition-opacity duration-200">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100">
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                    ❓
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 text-base">${title}</h3>
                </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">${message}</p>
            <div class="flex space-x-3">
                <button onclick="closeModernModal('modernConfirmModal')" class="w-1/2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-sm transition">
                    Batal
                </button>
                <button id="btnModernConfirmAction" class="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                    Ya, Lanjutkan
                </button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btnModernConfirmAction').onclick = () => {
        closeModernModal('modernConfirmModal');
        onConfirm();
    };
}

function closeModernModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

// ==========================================
// HANDLER AUTENTIKASI ADMIN
// ==========================================
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();

        const client = getSupabase();
        if (!client) {
            showModernAlert('Koneksi Supabase belum siap!', 'Gagal Koneksi', 'error');
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
                showModernAlert('Username atau Password Admin Salah!', 'Akses Ditolak', 'error');
                return;
            }

            sessionStorage.setItem('cbt_admin_logged', 'true');
            sessionStorage.setItem('cbt_admin_name', data.nama_proktor || 'Proktor SMAN 1 Jakarta');
            initDashboard();
        } catch (err) {
            showModernAlert('Terjadi kesalahan koneksi: ' + err.message, 'Kesalahan Sistem', 'error');
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        showModernConfirm('Apakah Anda yakin ingin keluar dari panel admin ini?', 'Konfirmasi Logout', () => {
            sessionStorage.removeItem('cbt_admin_logged');
            sessionStorage.removeItem('cbt_admin_name');
            location.reload();
        });
    });
}

function checkAuth() {
    if (sessionStorage.getItem('cbt_admin_logged') === 'true') {
        initDashboard();
    }
}

async function initDashboard() {
    if (loginModal) loginModal.classList.add('hidden');
    if (dashboardApp) dashboardApp.classList.remove('hidden');
    
    const selectElem = document.getElementById('selectAdminServer');
    if (selectElem && window.currentServerKey) {
        selectElem.value = window.currentServerKey;
    }

    // Muat exams terlebih dahulu agar mapping nama mapel di history tersedia
    await fetchExams();
    fetchGlobalSettings();
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

async function saveGlobalSettings(syncAll = false) {
    const enter_password = document.getElementById('globalEnterPassword').value.trim() || '12345';
    const exit_password = document.getElementById('globalExitPassword').value.trim() || '123456';
    const screen_brightness = parseInt(document.getElementById('globalBrightness').value) || 100;
    const sound_volume = parseInt(document.getElementById('globalVolume').value) || 100;

    // Payload bersih tanpa 'updated_at' agar aman untuk semua database server
    const payload = {
        id: 1,
        enter_password,
        exit_password,
        screen_brightness,
        sound_volume
    };

    // ==========================================
    // SKEMA 2: SINKRON KE SEMUA SERVER (X, XI, XII)
    // ==========================================
    if (syncAll) {
        if (typeof SUPABASE_SERVERS === 'undefined' || !window.supabase) {
            showModernAlert('Konfigurasi multi-server tidak ditemukan.', 'Gagal', 'error');
            return;
        }

        const serverKeys = Object.keys(SUPABASE_SERVERS);
        const results = await Promise.all(
            serverKeys.map(async (key) => {
                const srv = SUPABASE_SERVERS[key];
                const tempClient = window.supabase.createClient(srv.url, srv.anonKey || srv.key || srv.apiKey);
                const { error } = await tempClient.from('app_settings').upsert(payload);
                return { key, name: srv.name || `Kelas ${key}`, error };
            })
        );

        const failed = results.filter(r => r.error);
        if (failed.length === 0) {
            showModernAlert(
                'Pengaturan Global CBT berhasil disinkronkan ke seluruh server (X, XI, dan XII)!',
                'Sinkronisasi Semua Server Berhasil',
                'success'
            );
        } else {
            const errDetails = failed.map(f => `• <b>${f.name}</b>: ${f.error.message}`).join('<br>');
            showModernAlert('Sebagian server gagal diperbarui:<br>' + errDetails, 'Peringatan Sinkronisasi', 'error');
        }
        return;
    }

    // ==========================================
    // SKEMA 1: SIMPAN HANYA DI SERVER AKTIF SAAT INI
    // ==========================================
    const client = getSupabase();
    if (!client) {
        showModernAlert('Koneksi database server aktif tidak tersedia.', 'Gagal', 'error');
        return;
    }

    const activeKey = window.currentServerKey || 'Aktif';
    const activeName = (typeof SUPABASE_SERVERS !== 'undefined' && SUPABASE_SERVERS[activeKey])
        ? SUPABASE_SERVERS[activeKey].name
        : `Server ${activeKey}`;

    const { error } = await client.from('app_settings').upsert(payload);

    if (!error) {
        showModernAlert(
            `Pengaturan berhasil disimpan khusus untuk <b>${activeName}</b>!`,
            'Berhasil Disimpan',
            'success'
        );
    } else {
        showModernAlert('Gagal menyimpan pengaturan: ' + error.message, 'Gagal', 'error');
    }
}

// ==========================================
// 2. MANAJEMEN SOAL UJIAN (PENCARIAN, FILTER & AUTOMATION DROPDOWN)
// ==========================================
let allExamsData = [];
let filteredExamsData = [];

async function fetchExams() {
    const client = getSupabase();
    if (!client) return;

    const { data, error } = await client.from('exams').select('*').order('created_at', { ascending: false });

    if (!error && data) {
        allExamsData = data;
        populateClassDropdowns();
        populateExamFilterOptions();
        filterExams();
    } else {
        allExamsData = [];
        renderExamTable();
    }
}

// POPULATE DROPDOWN KELAS OTOMATIS SESUAI ANGKATAN ACTIVE SERVER
function populateClassDropdowns() {
    const serverKey = window.currentServerKey || (typeof getActiveServerKey === 'function' ? getActiveServerKey() : 'XI');
    const selectAdd = document.getElementById('inputClass');
    const selectEdit = document.getElementById('editClass');

    let optionsHtml = `<option value="SEMUA">🌐 Semua Kelas di Angkatan Ini</option><optgroup label="Pilih Rombel Spesifik">`;
    for (let i = 1; i <= 10; i++) {
        optionsHtml += `<option value="${serverKey}-${i}">Kelas ${serverKey}-${i}</option>`;
    }
    optionsHtml += `</optgroup>`;

    if (selectAdd) selectAdd.innerHTML = optionsHtml;
    if (selectEdit) selectEdit.innerHTML = optionsHtml;
}

// POPULATE OPTION FILTER KELAS DI TOOLBAR
function populateExamFilterOptions() {
    const select = document.getElementById('filterExamClassSelect');
    if (!select) return;

    const currentVal = select.value;
    const classes = [...new Set(allExamsData.map(e => e.student_class).filter(Boolean))].sort();

    select.innerHTML = `<option value="">Semua Target Rombel</option>` + 
        classes.map(c => `<option value="${c}">${c === 'SEMUA' ? '🌐 Semua Kelas' : c}</option>`).join('');

    select.value = currentVal;
}

// FUNGSI FILTERING SOAL (TERMASUK SEARCH DAN STATUS TAYANG)
function filterExams() {
    const searchVal = document.getElementById('searchExamInput')?.value.toLowerCase().trim() || '';
    const classVal = document.getElementById('filterExamClassSelect')?.value || '';
    const statusVal = document.getElementById('filterExamStatusSelect')?.value || '';

    filteredExamsData = allExamsData.filter(e => {
        const matchesSearch = !searchVal || (e.subject_name && e.subject_name.toLowerCase().includes(searchVal));
        const matchesClass = !classVal || e.student_class === classVal;
        
        let matchesStatus = true;
        if (statusVal === 'active') matchesStatus = (e.is_active === true);
        if (statusVal === 'inactive') matchesStatus = (e.is_active === false);

        return matchesSearch && matchesClass && matchesStatus;
    });

    renderExamTable();
}

// RENDER TABEL SOAL UJIAN
function renderExamTable() {
    const tbody = document.getElementById('examTableBody');
    const info = document.getElementById('examCountInfo');
    if (!tbody) return;

    if (filteredExamsData.length > 0) {
        tbody.innerHTML = filteredExamsData.map(e => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-3.5 font-bold text-slate-700">
                    <span class="px-2.5 py-1 rounded-lg ${e.student_class === 'SEMUA' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}">
                        ${e.student_class || 'SEMUA'}
                    </span>
                </td>
                <td class="p-3.5 font-semibold text-slate-800">${e.subject_name}</td>
                <td class="p-3.5">
                    <button onclick="toggleExamStatus(${e.id}, ${!e.is_active})" class="px-3 py-1.5 rounded-full text-xs font-bold transition ${e.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}">
                        ${e.is_active ? '🟢 TAMPIL (AKTIF)' : '🔴 DISEMBUNYIKAN'}
                    </button>
                </td>
                <td class="p-3.5 text-xs text-slate-500 font-mono">
                    ${e.start_time ? new Date(e.start_time).toLocaleString('id-ID') : 'Langsung'} s/d <br>
                    ${e.end_time ? new Date(e.end_time).toLocaleString('id-ID') : 'Tidak dibatasi'}
                </td>
                <td class="p-3.5 text-center space-x-2">
                    <button onclick='openEditExamModal(${JSON.stringify(e)})' class="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">Edit</button>
                    <button onclick="deleteExam(${e.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Hapus</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data soal ditemukan</td></tr>`;
    }

    if (info) info.innerText = `Menampilkan ${filteredExamsData.length} dari total ${allExamsData.length} soal ujian`;
}

async function toggleExamStatus(id, newStatus) {
    const client = getSupabase();
    if (!client) return;
    await client.from('exams').update({ is_active: newStatus }).eq('id', parseInt(id, 10));
    fetchExams();
}

async function deleteExam(id) {
    showModernConfirm('Apakah Anda yakin ingin menghapus tautan soal ini?', 'Hapus Soal', async () => {
        const client = getSupabase();
        if (!client) return;
        await client.from('exams').delete().eq('id', parseInt(id, 10));
        fetchExams();
    });
}

function openEditExamModal(exam) {
    document.getElementById('editExamId').value = exam.id;
    document.getElementById('editClass').value = exam.student_class || 'SEMUA';
    document.getElementById('editSubject').value = exam.subject_name || '';
    document.getElementById('editUrl').value = exam.form_url || '';
    document.getElementById('editStartTime').value = exam.start_time ? exam.start_time.slice(0, 16) : '';
    document.getElementById('editEndTime').value = exam.end_time ? exam.end_time.slice(0, 16) : '';
    document.getElementById('editExamModal')?.classList.remove('hidden');
}

document.getElementById('editExamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = getSupabase();
    if (!client) return;

    const rawId = document.getElementById('editExamId').value;
    const id = parseInt(rawId, 10);
    const student_class = document.getElementById('editClass').value;
    const subject_name = document.getElementById('editSubject').value.trim();
    const form_url = document.getElementById('editUrl').value.trim();
    const start_time = document.getElementById('editStartTime').value ? new Date(document.getElementById('editStartTime').value).toISOString() : null;
    const end_time = document.getElementById('editEndTime').value ? new Date(document.getElementById('editEndTime').value).toISOString() : null;

    const { error } = await client.from('exams').update({ student_class, subject_name, form_url, start_time, end_time }).eq('id', id);
    if (!error) {
        closeEditModal('editExamModal');
        await fetchExams();
        showModernAlert('Data soal berhasil diperbarui!', 'Berhasil', 'success');
    } else {
        showModernAlert('Gagal mengupdate soal: ' + error.message, 'Gagal', 'error');
    }
});

const addExamForm = document.getElementById('addExamForm');
if (addExamForm) {
    addExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const client = getSupabase();
        if (!client) return;

        const student_class = document.getElementById('inputClass').value;
        const subject_name = document.getElementById('inputSubject').value.trim();
        const form_url = document.getElementById('inputUrl').value.trim();
        const start_time = document.getElementById('inputStartTime').value ? new Date(document.getElementById('inputStartTime').value).toISOString() : null;
        const end_time = document.getElementById('inputEndTime').value ? new Date(document.getElementById('inputEndTime').value).toISOString() : null;

        await client.from('exams').insert([{ student_class, subject_name, form_url, start_time, end_time, is_active: true }]);
        addExamForm.reset();
        await fetchExams();
        showModernAlert('Soal ujian berhasil ditambahkan!', 'Berhasil', 'success');
    });
}

// ==========================================
// 3. DATABASE SISWA
// ==========================================
let allStudentsData = [];
let filteredStudentsData = [];
let currentStudentPage = 1;
let rowsPerPage = 25;

async function fetchStudents() {
    const client = getSupabase();
    if (!client) return;

    const { data, error } = await client.from('students').select('*').order('nama', { ascending: true });
    
    if (!error && data) {
        allStudentsData = data;
        populateClassFilterOptions();
        filterStudents();
    } else {
        allStudentsData = [];
        renderStudentTable();
    }
}

function populateClassFilterOptions() {
    const select = document.getElementById('filterClassSelect');
    if (!select) return;

    const currentVal = select.value;
    const classes = [...new Set(allStudentsData.map(s => s.student_class).filter(Boolean))].sort();

    select.innerHTML = `<option value="">Semua Kelas / Rombel</option>` + 
        classes.map(c => `<option value="${c}">${c}</option>`).join('');

    select.value = currentVal;
}

function filterStudents() {
    const searchVal = document.getElementById('searchStudentInput')?.value.toLowerCase().trim() || '';
    const classVal = document.getElementById('filterClassSelect')?.value || '';
    const sortVal = document.getElementById('sortStudentSelect')?.value || 'nama_asc';

    filteredStudentsData = allStudentsData.filter(s => {
        const matchesSearch = !searchVal || 
            (s.nisn && s.nisn.toLowerCase().includes(searchVal)) || 
            (s.nama && s.nama.toLowerCase().includes(searchVal));

        const matchesClass = !classVal || s.student_class === classVal;

        return matchesSearch && matchesClass;
    });

    filteredStudentsData.sort((a, b) => {
        if (sortVal === 'nama_asc') {
            return (a.nama || '').localeCompare(b.nama || '');
        } else if (sortVal === 'nama_desc') {
            return (b.nama || '').localeCompare(a.nama || '');
        } else if (sortVal === 'nisn_asc') {
            return (a.nisn || '').localeCompare(b.nisn || '', undefined, { numeric: true });
        } else if (sortVal === 'class_asc') {
            return (a.student_class || '').localeCompare(b.student_class || '');
        }
        return 0;
    });

    currentStudentPage = 1;
    renderStudentTable();
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    const total = filteredStudentsData.length;
    const totalPages = Math.ceil(total / rowsPerPage) || 1;

    if (currentStudentPage < 1) currentStudentPage = 1;
    if (currentStudentPage > totalPages) currentStudentPage = totalPages;

    const startIdx = (currentStudentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, total);

    const pageData = filteredStudentsData.slice(startIdx, endIdx);

    if (pageData.length > 0) {
        tbody.innerHTML = pageData.map(s => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-3 text-center">
                    <input type="checkbox" value="${s.id}" class="student-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                </td>
                <td class="p-3 font-mono font-bold text-slate-800">${s.nisn}</td>
                <td class="p-3 font-bold text-slate-800 uppercase">${s.nama}</td>
                <td class="p-3 font-semibold text-slate-600">${s.student_class}</td>
                <td class="p-3 font-mono text-xs text-slate-500">${s.password || '<i class="text-slate-300">Default (NISN)</i>'}</td>
                <td class="p-3 text-center space-x-1">
                    <button onclick='openEditStudentModal(${JSON.stringify(s)})' class="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition" title="Edit Data">
                        ✏️
                    </button>
                    <button onclick="deleteStudent(${s.id})" class="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Hapus Siswa">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Tidak ada data siswa ditemukan</td></tr>`;
    }

    const info = document.getElementById('studentPaginationInfo');
    if (info) {
        info.innerText = total > 0 
            ? `${startIdx + 1}-${endIdx} dari ${total} siswa` 
            : `0 dari 0 siswa`;
    }

    const lblPage = document.getElementById('lblCurrentPage');
    if (lblPage) lblPage.innerText = `Hal ${currentStudentPage} / ${totalPages}`;

    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (btnPrev) btnPrev.disabled = (currentStudentPage <= 1);
    if (btnNext) btnNext.disabled = (currentStudentPage >= totalPages);

    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
}

function changeRowsPerPage(val) {
    rowsPerPage = parseInt(val) || 25;
    currentStudentPage = 1;
    renderStudentTable();
}

function prevStudentPage() {
    if (currentStudentPage > 1) {
        currentStudentPage--;
        renderStudentTable();
    }
}

function nextStudentPage() {
    const totalPages = Math.ceil(filteredStudentsData.length / rowsPerPage) || 1;
    if (currentStudentPage < totalPages) {
        currentStudentPage++;
        renderStudentTable();
    }
}

function toggleSelectAllStudents(master) {
    document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = master.checked);
}

function openAddStudentModal() {
    document.getElementById('addStudentModal')?.classList.remove('hidden');
}

async function deleteSelectedStudents() {
    const selectedIds = Array.from(document.querySelectorAll('.student-checkbox:checked')).map(cb => parseInt(cb.value)).filter(Boolean);
    if (!selectedIds.length) {
        showModernAlert('Pilih minimal satu siswa untuk dihapus!', 'Peringatan', 'error');
        return;
    }

    showModernConfirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data siswa terpilih?`, 'Hapus Masal Siswa', async () => {
        const client = getSupabase();
        if (!client) return;

        const { error } = await client.from('students').delete().in('id', selectedIds);
        if (!error) {
            showModernAlert(`${selectedIds.length} data siswa berhasil dihapus!`, 'Berhasil', 'success');
            fetchStudents();
        } else {
            showModernAlert('Gagal menghapus data: ' + error.message, 'Gagal', 'error');
        }
    });
}

async function deleteStudent(id) {
    showModernConfirm('Hapus data akun siswa ini dari database?', 'Hapus Siswa', async () => {
        const client = getSupabase();
        if (!client) return;
        await client.from('students').delete().eq('id', parseInt(id, 10));
        fetchStudents();
    });
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

    const id = parseInt(document.getElementById('editStudentId').value, 10);
    const nisn = document.getElementById('editStudentNisn').value.trim();
    const nama = document.getElementById('editStudentName').value.trim();
    const student_class = document.getElementById('editStudentClass').value.trim();
    const password = document.getElementById('editStudentPassword').value.trim() || null;

    const { error } = await client.from('students').update({ nisn, nama, student_class, password }).eq('id', id);
    if (!error) {
        closeEditModal('editStudentModal');
        fetchStudents();
        showModernAlert('Data siswa berhasil diperbarui!', 'Berhasil', 'success');
    } else {
        showModernAlert('Gagal mengupdate siswa: ' + error.message, 'Gagal', 'error');
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
        closeEditModal('addStudentModal');
        fetchStudents();
        showModernAlert('Data siswa baru berhasil ditambahkan!', 'Berhasil', 'success');
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
    if (!fileInput.files.length) return showModernAlert('Silakan pilih file Excel terlebih dahulu!', 'Peringatan', 'error');

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

            if (!jsonData.length) return showModernAlert('File Excel kosong atau format tidak sesuai!', 'File Kosong', 'error');

            const formattedStudents = jsonData.map(item => ({
                nisn: String(item.NISN || item.nisn || '').trim(),
                nama: String(item.NAMA || item.nama || '').trim(),
                student_class: String(item.KELAS || item.student_class || '').trim(),
                password: item.PASSWORD || item.password ? String(item.PASSWORD || item.password).trim() : null
            })).filter(s => s.nisn && s.nama && s.student_class);

            if (!formattedStudents.length) return showModernAlert('Tidak ada data valid yang ditemukan pada kolom NISN, NAMA, dan KELAS.', 'Format Salah', 'error');

            const { error } = await client.from('students').upsert(formattedStudents, { onConflict: 'nisn' });
            if (!error) {
                showModernAlert(`Berhasil mengimpor/memperbarui ${formattedStudents.length} data siswa!`, 'Import Sukses', 'success');
                fileInput.value = '';
                fetchStudents();
            } else {
                showModernAlert('Gagal mengimpor ke database: ' + error.message, 'Gagal Import', 'error');
            }
        } catch (err) {
            showModernAlert('Kesalahan saat membaca file Excel: ' + err.message, 'Format File Rusak', 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

// ==========================================
// 4. RIWAYAT PENGERJAAN SISWA (MULTI-MAPEL)
// ==========================================
let allHistoryData = [];
let filteredHistoryData = [];
let currentHistoryPage = 1;
let historyRowsPerPage = 25;

async function fetchHistory() {
    const client = getSupabase();
    if (!client) return;

    const { data, error } = await client
        .from('exam_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) {
        allHistoryData = data;
        populateHistoryFilterOptions();
        filterHistory();
    } else {
        allHistoryData = [];
        renderHistoryTable();
    }
}

function populateHistoryFilterOptions() {
    const classSelect = document.getElementById('filterHistoryClassSelect');
    const subjectSelect = document.getElementById('filterHistorySubjectSelect');

    if (classSelect) {
        const currentClass = classSelect.value;
        const classes = [...new Set(allHistoryData.map(h => h.student_class).filter(Boolean))].sort();
        classSelect.innerHTML = `<option value="">Semua Kelas / Rombel</option>` + 
            classes.map(c => `<option value="${c}">${c}</option>`).join('');
        classSelect.value = currentClass;
    }

    if (subjectSelect) {
        const currentSubject = subjectSelect.value;
        const subjects = [...new Set(allHistoryData.map(h => {
            const rawSubject = String(h.subject_name || h.subject_id || '').trim();
            const matchExam = (allExamsData || []).find(e => 
                String(e.id).trim() === rawSubject || 
                (e.subject_name && e.subject_name.trim().toLowerCase() === rawSubject.toLowerCase())
            );
            return matchExam ? matchExam.subject_name : rawSubject;
        }).filter(Boolean))].sort();

        subjectSelect.innerHTML = `<option value="">Semua Mata Pelajaran</option>` + 
            subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        subjectSelect.value = currentSubject;
    }
}

function filterHistory() {
    const searchVal = document.getElementById('searchHistoryInput')?.value.toLowerCase().trim() || '';
    const classVal = document.getElementById('filterHistoryClassSelect')?.value || '';
    const subjectVal = document.getElementById('filterHistorySubjectSelect')?.value || '';
    const sortVal = document.getElementById('sortHistorySelect')?.value || 'time_desc';

    filteredHistoryData = allHistoryData.filter(h => {
        const matchesSearch = !searchVal || 
            (h.nisn && h.nisn.toLowerCase().includes(searchVal)) || 
            (h.student_name && h.student_name.toLowerCase().includes(searchVal));

        const matchesClass = !classVal || h.student_class === classVal;

        const rawSubject = String(h.subject_name || h.subject_id || '').trim();
        const matchExam = (allExamsData || []).find(e => 
            String(e.id).trim() === rawSubject || 
            (e.subject_name && e.subject_name.trim().toLowerCase() === rawSubject.toLowerCase())
        );
        const resolvedSubject = matchExam ? matchExam.subject_name : rawSubject;

        const matchesSubject = !subjectVal || resolvedSubject === subjectVal;

        return matchesSearch && matchesClass && matchesSubject;
    });

    filteredHistoryData.sort((a, b) => {
        if (sortVal === 'time_desc') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        } else if (sortVal === 'nama_asc') {
            return (a.student_name || '').localeCompare(b.student_name || '');
        } else if (sortVal === 'nisn_asc') {
            return (a.nisn || '').localeCompare(b.nisn || '', undefined, { numeric: true });
        } else if (sortVal === 'class_asc') {
            return (a.student_class || '').localeCompare(b.student_class || '');
        }
        return 0;
    });

    currentHistoryPage = 1;
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const total = filteredHistoryData.length;
    const totalPages = Math.ceil(total / historyRowsPerPage) || 1;

    if (currentHistoryPage < 1) currentHistoryPage = 1;
    if (currentHistoryPage > totalPages) currentHistoryPage = totalPages;

    const startIdx = (currentHistoryPage - 1) * historyRowsPerPage;
    const endIdx = Math.min(startIdx + historyRowsPerPage, total);

    const pageData = filteredHistoryData.slice(startIdx, endIdx);

    if (pageData.length > 0) {
        tbody.innerHTML = pageData.map(h => {
            const rawSubject = String(h.subject_name || h.subject_id || '').trim();
            const matchExam = (allExamsData || []).find(e => 
                String(e.id).trim() === rawSubject || 
                (e.subject_name && e.subject_name.trim().toLowerCase() === rawSubject.toLowerCase())
            );
            const displaySubjectName = matchExam ? matchExam.subject_name : (rawSubject || 'Ujian CBT');

            return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-3 font-mono font-bold text-slate-800">${h.nisn}</td>
                <td class="p-3 font-bold text-slate-800 uppercase">${h.student_name || 'Siswa'}</td>
                <td class="p-3 font-semibold text-slate-600">${h.student_class || '-'}</td>
                <td class="p-3 font-bold text-blue-700">${displaySubjectName}</td>
                <td class="p-3 text-slate-500 font-mono text-[11px]">
                    ${h.created_at ? new Date(h.created_at).toLocaleString('id-ID') : '-'}
                </td>
                <td class="p-3">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${h.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                        ${h.is_completed ? 'Terkunci (Selesai)' : 'Sedang Mengerjakan'}
                    </span>
                </td>
                <td class="p-3 text-center space-x-2">
                    <button onclick="toggleRetestPermission(${h.id}, ${!h.is_completed})" class="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                        ${h.is_completed ? 'Izinkan Ujian Ulang' : 'Kunci Ujian'}
                    </button>
                    <button onclick="deleteSubmission(${h.id})" class="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        Hapus
                    </button>
                </td>
            </tr>`;
        }).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Tidak ada riwayat pengerjaan ditemukan</td></tr>`;
    }

    const info = document.getElementById('historyPaginationInfo');
    if (info) {
        info.innerText = total > 0 
            ? `Menampilkan ${startIdx + 1}-${endIdx} dari ${total} data` 
            : `Menampilkan 0 dari 0 data`;
    }

    const lblPage = document.getElementById('lblCurrentHistoryPage');
    if (lblPage) lblPage.innerText = `Hal ${currentHistoryPage} / ${totalPages}`;

    const btnPrev = document.getElementById('btnPrevHistoryPage');
    const btnNext = document.getElementById('btnNextHistoryPage');

    if (btnPrev) btnPrev.disabled = (currentHistoryPage <= 1);
    if (btnNext) btnNext.disabled = (currentHistoryPage >= totalPages);
}

function changeHistoryRowsPerPage(val) {
    historyRowsPerPage = parseInt(val) || 25;
    currentHistoryPage = 1;
    renderHistoryTable();
}

function prevHistoryPage() {
    if (currentHistoryPage > 1) {
        currentHistoryPage--;
        renderHistoryTable();
    }
}

function nextHistoryPage() {
    const totalPages = Math.ceil(filteredHistoryData.length / historyRowsPerPage) || 1;
    if (currentHistoryPage < totalPages) {
        currentHistoryPage++;
        renderHistoryTable();
    }
}

async function deleteSubmission(id) {
    showModernConfirm('Hapus riwayat pengerjaan mapel ini? Siswa akan dapat mengerjakan mapel ini dari awal.', 'Hapus Riwayat', async () => {
        const client = getSupabase();
        if (!client) return;
        await client.from('exam_submissions').delete().eq('id', parseInt(id, 10));
        fetchHistory();
    });
}

async function deleteAllSubmissions() {
    showModernConfirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat pengerjaan siswa?', 'Hapus Masal Riwayat', async () => {
        const client = getSupabase();
        if (!client) return;

        const { error } = await client.from('exam_submissions').delete().neq('id', 0);
        if (!error) {
            showModernAlert('Semua riwayat pengerjaan berhasil dibersihkan!', 'Berhasil', 'success');
            fetchHistory();
        } else {
            showModernAlert('Gagal menghapus data: ' + error.message, 'Gagal', 'error');
        }
    });
}

async function toggleRetestPermission(id, newCompletedState) {
    const client = getSupabase();
    if (!client) return;
    await client.from('exam_submissions').update({ is_completed: newCompletedState }).eq('id', parseInt(id, 10));
    fetchHistory();
}

document.addEventListener('DOMContentLoaded', checkAuth);
