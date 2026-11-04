// Mengambil Elemen DOM
const tableBody = document.getElementById('violationTableBody');
const addExamForm = document.getElementById('addExamForm');

// 1. FUNGSI AMBIL LOG PELANGGARAN DARI SUPABASE
async function fetchViolations() {
    try {
        const { data, error } = await supabase
            .from('violations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            renderViolationTable(data);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center text-slate-400">Belum ada pelanggaran terdeteksi...</td>
                </tr>
            `;
        }
    } catch (err) {
        console.error('Gagal mengambil data:', err.message);
    }
}

// 2. FUNGSI RENDER TABEL
function renderViolationTable(data) {
    tableBody.innerHTML = data.map(item => {
        const timeString = new Date(item.created_at).toLocaleTimeString('id-ID');
        return `
            <tr class="border-b hover:bg-red-50/50 transition new-violation-row">
                <td class="p-3 text-sm text-slate-600">${timeString} WIB</td>
                <td class="p-3 font-semibold text-slate-700">${item.nisn}</td>
                <td class="p-3"><span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">${item.student_class}</span></td>
                <td class="p-3"><span class="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">${item.violation_type}</span></td>
            </tr>
        `;
    }).join('');
}

// 3. FITUR REAL-TIME LISTENER (LIVE NOTIFICATION)
function subscribeToViolations() {
    supabase
        .channel('public:violations')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'violations' },
            (payload) => {
                console.log('Pelanggaran baru terdeteksi:', payload.new);
                fetchViolations(); // Refresh otomatis saat ada data kecurangan baru
            }
        )
        .subscribe();
}

// 4. EKOSEKUSI FORM INPUT LINK SOAL BARU
if (addExamForm) {
    addExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const student_class = document.getElementById('inputClass').value.trim();
        const subject_name = document.getElementById('inputSubject').value.trim();
        const form_url = document.getElementById('inputUrl').value.trim();

        try {
            const { error } = await supabase
                .from('exams')
                .insert([{ student_class, subject_name, form_url }]);

            if (error) throw error;

            alert('Link Ujian Berhasil Disimpan!');
            addExamForm.reset();
        } catch (err) {
            alert('Gagal menyimpan link: ' + err.message);
        }
    });
}

// Jalankan Fungsi Utama Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
    fetchViolations();
    subscribeToViolations();
});
