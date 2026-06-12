import { useState, useEffect } from 'react';
import { Edit3, UserCog, X, Loader2, ArrowDownUp, MousePointerClick } from 'lucide-react';
import Button from '../../Button';
import { useAuthStore } from '../../../../store/useAuthStore';

interface ShiftDetail {
    id_jadwal: number;
    kode: string;
    warna: string;
    shift_id: number;
}

interface PegawaiMatrix {
    id: number;
    nama: string;
    jabatan: string;
    jadwal: { [tanggal: string]: ShiftDetail };
}

export default function TabelMatrixJadwal() {
    const token = useAuthStore((state) => state.token);

    // State Kalender Dinamis (Default: Bulan & Tahun Hari Ini)
    // State Filter Tanggal Fleksibel (Default: Tanggal 1 s/d Akhir Bulan Ini)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');

    const [filterStartDate, setFilterStartDate] = useState(firstDay);
    const [filterEndDate, setFilterEndDate] = useState(lastDay);
    
    // Fungsi untuk men-generate deretan tanggal di antara Start dan End
    const getDatesInRange = (startStr: string, endStr: string) => {
        const dateArray = [];
        const currentDate = new Date(startStr);
        const stopDate = new Date(endStr);
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    };

    const daysArray = getDatesInRange(filterStartDate, filterEndDate);

    const [matrixKaryawan, setMatrixKaryawan] = useState<PegawaiMatrix[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // State untuk Form Interaksi Modal
    const [selectedCell, setSelectedCell] = useState<{ pegawaiId: number; pegawaiNama: string; tanggal: string; idJadwal?: number; shiftId?: number; shiftKode?: string; warna?: string }>({
        pegawaiId: 0, pegawaiNama: "", tanggal: ""
    });
    const [cellTujuan, setCellTujuan] = useState<{ pegawaiId: number; pegawaiNama: string; tanggal: string; shiftKode?: string; warna?: string } | null>(null);
    const [pickerActive, setPickerActive] = useState<'none' | 'asal' | 'tujuan'>('none');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modeAksi, setModeAksi] = useState<'ubah' | 'tukar'>('ubah');
    const [isSaving, setIsSaving] = useState(false);
   // ==========================================
    // STATE BARU: KHUSUS MODAL GENERATE MASSAL
    // ==========================================
    const [isModalMassalOpen, setIsModalMassalOpen] = useState(false);
    const [massalTanggalMulai, setMassalTanggalMulai] = useState("");
    const [massalTanggalSelesai, setMassalTanggalSelesai] = useState("");
    const [massalShiftId, setMassalShiftId] = useState("");
    

    // // 1. STATE BARU: Master Pegawai
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [listPegawai, setListPegawai] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [listMasterShifts, setListMasterShifts] = useState<any[]>([]);

    // State Input Form Modal
    const [inputShiftId, setInputShiftId] = useState("");
    const year = today.getFullYear();
    const month = today.getMonth(); // 0 = Januari, 11 = Des
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 1. Fungsi Fetch Master Shift dari Database
    const loadMasterShifts = async () => {
        try {
            const response = await fetch("https://ppm-sooty.vercel.app/api/v1/shifts", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setListMasterShifts(result.data);
            }
        } catch (err) {
            console.error("Gagal memuat master shift:", err);
        }
    };


    // 2. FUNGSI FETCH PEGAWAI
    const loadPegawai = async () => {
        try {
            const response = await fetch("https://ppm-sooty.vercel.app/api/v1/pegawai", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setListPegawai(result.data);
            }
        } catch (err) {
            console.error("Gagal memuat master pegawai:", err);
        }
    };

    

    // =========================================================================
    // 1. ENGINE TRANSFORMASI: MENGUBAH FLAT ARRAY MENJADI MATRIX DATA
    // =========================================================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformToMatrix = (backendData: any[]): PegawaiMatrix[] => {
        const matrixMap: { [key: number]: PegawaiMatrix } = {};

        backendData.forEach(item => {
            const pegId = item.pegawai_id;
            if (!matrixMap[pegId]) {
                matrixMap[pegId] = {
                    id: pegId,
                    nama: item.pegawai?.nama || "Tanpa Nama",
                    jabatan: item.pegawai?.jabatan?.nama_jabatan || "-",
                    jadwal: {}
                };
            }

            // ==========================================================
            // PENENTUAN WARNA DINAMIS BERDASARKAN JAM MASUK
            // ==========================================================
            let warnaBorders = "bg-rose-100 text-rose-700 border-rose-200"; // Default OFF / Libur
            const kode = item.shifts?.kode_shift || "OFF";
            const jamMasukStr = item.shifts?.jam_masuk; // Format: "08:00:00"

            if (jamMasukStr) {
                const jam = parseInt(jamMasukStr.substring(0, 2)); // Ambil 2 digit jam pertama

                if (jam >= 5 && jam <= 10) {
                    // PAGI (05:00 - 10:59): Gradasi Kuning Pucat, Pink, dan Oranye
                    warnaBorders = "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 text-orange-800 border-orange-300";
                } else if (jam >= 11 && jam <= 14) {
                    // SIANG (11:00 - 14:59): Biru Langit Cerah
                    warnaBorders = "bg-sky-100 text-sky-800 border-sky-300";
                } else if (jam >= 15 && jam <= 18) {
                    // SORE (15:00 - 18:59): Hijau Zamrud
                    warnaBorders = "bg-emerald-100 text-emerald-800 border-emerald-300";
                } else {
                    // MALAM (19:00 - 04:59): Ungu / Indigo Gelap
                    warnaBorders = "bg-indigo-900 text-indigo-100 border-indigo-700 shadow-inner";
                }
            }

            matrixMap[pegId].jadwal[item.tanggal] = {
                id_jadwal: item.id,
                kode: kode,
                warna: warnaBorders,
                shift_id: item.shift_id
            };
        });

        return Object.values(matrixMap);
    };

    // =========================================================================
    // 2. FETCH DATA JADWAL BULANAN DARI BACKEND
    // =========================================================================
    const loadJadwalBulanan = async () => {
        setIsLoading(true);
        setErrorMsg("");
        try {
            // Gunakan start_date dan end_date sebagai parameter query
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jadwal?start_date=${filterStartDate}&end_date=${filterEndDate}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const matrixFormat = transformToMatrix(result.data);
                setMatrixKaryawan(matrixFormat);
            } else {
                throw new Error(result.message || "Gagal memuat jadwal.");
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Terjadi kesalahan koneksi jaringan.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                await loadJadwalBulanan();
                await loadMasterShifts(); 
                await loadPegawai();
            }
        };
        fetchData();
    // Ganti currentDate dengan filterStartDate dan filterEndDate
    }, [filterStartDate, filterEndDate, token]);

    // Handle klik sel kotak tanggal
    const handleCellClick = (pegawaiId: number, pegawaiNama: string, hari: number, shiftDetail?: ShiftDetail) => {
        const tglFormat = `${year}-${String(month + 1).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;
        
        // Jika sedang dalam Mode Pencarian (Picker) Sel TUJUAN
        if (pickerActive === 'tujuan') {
            setCellTujuan({
                pegawaiId, pegawaiNama, tanggal: tglFormat, 
                shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
            });
            setPickerActive('none'); // Matikan mode picker
            setIsModalOpen(true);    // Buka kembali modal
            return;
        }

        // Jika sedang dalam Mode Pencarian (Picker) Sel ASAL
        if (pickerActive === 'asal') {
            setSelectedCell({
                pegawaiId, pegawaiNama, tanggal: tglFormat, 
                idJadwal: shiftDetail?.id_jadwal, shiftId: shiftDetail?.shift_id,
                shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
            });
            setPickerActive('none'); 
            setIsModalOpen(true);    
            return;
        }

        // --- MODE NORMAL (Klik Pertama Kali) ---
        setSelectedCell({
            pegawaiId, pegawaiNama, tanggal: tglFormat,
            idJadwal: shiftDetail?.id_jadwal, shiftId: shiftDetail?.shift_id,
            shiftKode: shiftDetail?.kode, warna: shiftDetail?.warna
        });
        
        setInputShiftId(shiftDetail?.shift_id ? String(shiftDetail.shift_id) : "");
        setCellTujuan(null); // Reset tujuan setiap kali membuka modal baru
        setModeAksi('ubah');
        setIsModalOpen(true);
    };

    // =========================================================================
    // 3. SUBMIT AKSI A: SIMPAN PERUBAHAN SHIFT HARIAN (UPSERT)
    // =========================================================================
    const handleSimpanShiftHarian = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jadwal/harian`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    pegawai_id: selectedCell.pegawaiId,
                    tanggal: selectedCell.tanggal,
                    shift_id: inputShiftId === "off" || inputShiftId === "" ? null : parseInt(inputShiftId)
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert("Sukses memperbarui jadwal harian pegawai!");
                setIsModalOpen(false);
                await loadJadwalBulanan(); // Refresh matrix data
            } else {
                alert(result.message || "Gagal memperbarui shift.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsSaving(false);
        }
    };

    // =========================================================================
    // 4. SUBMIT AKSI B: PROSES TUKAR SHIFT LINTAS HARI
    // =========================================================================
    const handleProsesTukarShift = async () => {
        if (!cellTujuan) {
            alert("Harap pilih jadwal tujuan terlebih dahulu.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jadwal/tukar-shift`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    pegawai_id_asal: selectedCell.pegawaiId,
                    tanggal_asal: selectedCell.tanggal,
                    pegawai_id_tujuan: cellTujuan.pegawaiId, // Ambil dari cellTujuan
                    tanggal_tujuan: cellTujuan.tanggal       // Ambil dari cellTujuan
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert("🚀 Pertukaran shift lintas hari berhasil diproses!");
                setIsModalOpen(false);
                setCellTujuan(null);
                await loadJadwalBulanan();
            } else {
                alert(result.message || "Gagal memproses tukar shift.");
            }
        } catch (err) {
            alert(`Terjadi kesalahan sistem saat menukar: ${err}`);
        } finally {
            setIsSaving(false);
        }
    };

    // STATE UNTUK FITUR CHECKBOX CASCADING
    const [filterLevel1, setFilterLevel1] = useState<'all_karyawan' | 'filter_departemen'>('all_karyawan');
    const [filterLevel2, setFilterLevel2] = useState(''); // Value Departemen
    const [filterLevel3, setFilterLevel3] = useState(''); // Value Jabatan
    const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<number[]>([]);

    // Helper untuk mengekstrak nama Departemen & Jabatan secara seragam
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDeptName = (p: any) => p.departemen?.nama_departemen || p.jabatan?.departemen?.nama_departemen || 'Umum';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getJabName = (p: any) => p.jabatan?.nama_jabatan || p.jabatan || 'Tanpa Jabatan';

    // Kumpulkan data unik untuk Dropdown
    const uniqueDepartemen = Array.from(new Set(listPegawai.map(getDeptName)));
    const pInSelectedDept = listPegawai.filter(p => getDeptName(p) === filterLevel2);
    const uniqueJabatanInDept = Array.from(new Set(pInSelectedDept.map(getJabName)));

    // ====================================================================
    // ENGINE PENENTU: Apa yang harus ditampilkan di Checkbox List?
    // ====================================================================
    type DisplayItem = { id: string | number, label: string, subLabel: string, pegawaiIds: number[] };
    let displayList: DisplayItem[] = [];

    if (filterLevel1 === 'all_karyawan') {
        // Mode 1: Tampilkan semua Karyawan
        displayList = listPegawai.map(p => ({
            id: p.id, label: p.nama, subLabel: getJabName(p), pegawaiIds: [p.id]
        }));
    } else if (filterLevel1 === 'filter_departemen') {
        if (filterLevel2 === '') {
            // Mode 2: Tampilkan semua Departemen
            uniqueDepartemen.forEach(deptName => {
                const pInDept = listPegawai.filter(p => getDeptName(p) === deptName);
                displayList.push({ id: deptName as string, label: deptName as string, subLabel: `${pInDept.length} Pegawai`, pegawaiIds: pInDept.map(p => p.id) });
            });
        } else if (filterLevel3 === '') {
            // Mode 3: Tampilkan semua Jabatan di dalam Departemen Terpilih
            uniqueJabatanInDept.forEach(jabName => {
                const pInJab = pInSelectedDept.filter(p => getJabName(p) === jabName);
                displayList.push({ id: jabName as string, label: jabName as string, subLabel: `${pInJab.length} Pegawai`, pegawaiIds: pInJab.map(p => p.id) });
            });
        } else {
            // Mode 4: Tampilkan semua Karyawan di dalam Jabatan & Departemen Terpilih
            const pFinal = pInSelectedDept.filter(p => getJabName(p) === filterLevel3);
            displayList.push(...pFinal.map(p => ({
                id: p.id, label: p.nama, subLabel: p.nik || '-', pegawaiIds: [p.id]
            })));
        }
    }

    // ====================================================================
    // LOGIKA CHECKBOX (Berbasis Kumpulan ID Pegawai)
    // ====================================================================
    // Cek apakah suatu baris tercentang penuh
    const isItemSelected = (itemIds: number[]) => itemIds.length > 0 && itemIds.every(id => selectedPegawaiIds.includes(id));

    // Handle klik pada satu baris checkbox
    const handleToggleItem = (itemIds: number[]) => {
        if (isItemSelected(itemIds)) {
            // Jika sudah tercentang semua, hapus semua ID tersebut dari pilihan
            setSelectedPegawaiIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            // Jika belum / tercentang sebagian, tambahkan semua ID tersebut
            setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    // Logika Pilih Semua / Hapus Semua untuk daftar yang sedang tampil
    const visiblePegawaiIds = Array.from(new Set(displayList.flatMap(item => item.pegawaiIds)));
    const isAllVisibleSelected = visiblePegawaiIds.length > 0 && visiblePegawaiIds.every(id => selectedPegawaiIds.includes(id));

    const handleSelectAllVisible = () => {
        if (isAllVisibleSelected) {
            setSelectedPegawaiIds(prev => prev.filter(id => !visiblePegawaiIds.includes(id)));
        } else {
            setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...visiblePegawaiIds])));
        }
    };

    // =========================================================================
    // 5. SUBMIT AKSI C: PROSES GENERATE JADWAL MASSAL
    // =========================================================================
    const handleProsesGenerateMassal = async () => {
        if (!massalTanggalMulai || !massalTanggalSelesai) {
            alert("Harap lengkapi tanggal mulai, tanggal selesai, dan pilihan shift.");
            return;
        }

        if (new Date(massalTanggalMulai) > new Date(massalTanggalSelesai)) {
            alert("Tanggal mulai tidak boleh lebih besar dari tanggal selesai!");
            return;
        }

        if (selectedPegawaiIds.length === 0) {
            alert("Harap pilih minimal satu pegawai dari daftar target!");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/jadwal/generate-massal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`},
                body: JSON.stringify({
                    list_pegawai_ids: selectedPegawaiIds,
                    tanggal_mulai: massalTanggalMulai,
                    tanggal_selesai: massalTanggalSelesai,
                    shift_id: massalShiftId // <-- UBAH DI SINI: Hapus parseInt()
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert(`🚀 Sukses! ${result.message}`);
                setIsModalMassalOpen(false); 
                
                // Reset Form
                setMassalTanggalMulai("");
                setMassalTanggalSelesai("");
                setMassalShiftId("");
                setSelectedPegawaiIds([]); // Reset array centang
                
                await loadJadwalBulanan(); 
            } else {
                alert(result.message || "Gagal melakukan generate massal.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem saat memproses generate massal.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full overflow-hidden relative">
            
            {/* TOOLBAR TIMELINE FLEKSIBEL */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
                <div className="flex items-center gap-3 bg-white p-1.5 border border-gray-300 rounded-lg shadow-sm">
                    <div className="flex flex-col px-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Dari Tanggal</span>
                        <input 
                            type="date" 
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="text-sm font-bold text-gray-700 outline-none cursor-pointer"
                        />
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex flex-col px-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Sampai Tanggal</span>
                        <input 
                            type="date" 
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="text-sm font-bold text-gray-700 outline-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" label="Generate Jadwal Massal" onClick={() => setIsModalMassalOpen(true)} />
                </div>
            </div>

            {/* AREA MATRIX LOAD DATA */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                    <Loader2 className="animate-spin mb-3 text-blue-600" size={36} />
                    <p className="text-sm font-medium">Sinkronisasi Peta Shift Karyawan...</p>
                </div>
            ) : errorMsg ? (
                <div className="p-8 text-center text-red-600 font-medium bg-red-50/50 m-4 rounded-xl border border-red-200">
                    {errorMsg}
                </div>
            ) : (
                <div className="overflow-x-auto w-full relative">
                    <table className="w-full text-sm text-left border-collapse min-w-max">
                        {/* UPDATE HEADER TABEL */}
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 border-r border-gray-200 sticky left-0 z-30 bg-gray-100 min-w-[220px]">
                                    Nama Karyawan
                                </th>
                                {daysArray.map((dateObj, idx) => (
                                    <th key={idx} scope="col" className="px-2 py-3 border-r border-gray-200 text-center min-w-[60px] leading-tight">
                                        <div className="text-lg">{dateObj.getDate()}</div>
                                        <div className="text-[9px] text-gray-400">
                                            {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {matrixKaryawan.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="text-center p-10 text-gray-400 font-medium">
                                        Belum ada jadwal kerja dirilis pada bulan ini.
                                    </td>
                                </tr>
                            ) : (
                                matrixKaryawan.map((pegawai, index) => (
                                    <tr key={pegawai.id} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                                        
                                        <td className="px-4 py-3 border-r border-gray-200 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="font-bold text-gray-800">{pegawai.nama}</div>
                                            <div className="text-xs text-gray-500 font-medium">{pegawai.jabatan}</div>
                                        </td>

                                        {daysArray.map((dateObj, idx) => {
                                            const tglKey = dateObj.toLocaleDateString('en-CA'); // Hasil: "YYYY-MM-DD"
                                            const shiftDetail = pegawai.jadwal[tglKey];

                                            return (
                                                <td key={idx} className="p-1 border-r border-gray-100 relative group cursor-pointer"
                                                    onClick={() => handleCellClick(pegawai.id, pegawai.nama, dateObj.getDate(), shiftDetail)}>
                                                    
                                                    <div className="w-full h-full min-h-[38px] flex items-center justify-center">
                                                        {shiftDetail ? (
                                                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border tracking-wider shadow-sm transition-all ${shiftDetail.warna}`}>
                                                                {shiftDetail.kode}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 font-bold">-</span>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                                        <Edit3 size={14} className="text-blue-600 animate-pulse" />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FLOATING BANNER SAAT MODE PICKER AKTIF */}
            {pickerActive !== 'none' && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-10">
                    <MousePointerClick size={20} className="animate-bounce" />
                    <span className="text-sm">Silakan klik kotak jadwal di tabel untuk memilih sel {pickerActive === 'asal' ? 'ASAL' : 'TUJUAN'}...</span>
                    <button 
                        onClick={() => { setPickerActive('none'); setIsModalOpen(true); }} 
                        className="ml-4 bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors"
                        title="Batal Memilih"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* MODAL INTERAKTIF: PUSAT PENGATURAN SHIFT */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                        
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Kelola Slot Jadwal Kerja</h3>
                                <p className="text-xs text-gray-500 font-semibold mt-0.5">{selectedCell.pegawaiNama} • {selectedCell.tanggal}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-200 bg-gray-50/50">
                            <button 
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${modeAksi === 'ubah' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                onClick={() => setModeAksi('ubah')}
                            >
                                Ganti Shift Satuan
                            </button>
                            <button 
                                className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${modeAksi === 'tukar' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                onClick={() => setModeAksi('tukar')}
                            >
                                <UserCog size={16} /> Tukar Lintas Hari
                            </button>
                        </div>

                        <div className="p-5">
                            {modeAksi === 'ubah' ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Shift Baru</label>
                                        <select 
                                            value={inputShiftId}
                                            onChange={(e) => setInputShiftId(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                                        >
                                            <option value="">-- Pilih Aturan Shift --</option>
                                            {/* LOOPING DATA SHIFT SECARA DINAMIS */}
                                            {listMasterShifts.map((shift) => (
                                                <option key={shift.id} value={shift.id}>
                                                    {shift.kode_shift} ({shift.jam_masuk?.substring(0, 5)} - {shift.jam_pulang?.substring(0, 5)})
                                                </option>
                                            ))}
                                            <option value="off">LIBUR (OFF)</option>
                                        </select>
                                    </div>
                                    <Button 
                                        label={isSaving ? "Menyimpan..." : "Simpan Perubahan"} 
                                        className="mt-2 w-full" 
                                        disabled={isSaving}
                                        onClick={handleSimpanShiftHarian} 
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-blue-50 text-blue-800 text-[11px] p-2.5 rounded border border-blue-200 font-medium">
                                        Klik pada kotak di bawah ini untuk memilih jadwal langsung dari tabel kalender.
                                    </div>

                                    {/* 1. KOTAK SEL ASAL */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Jadwal Asal</label>
                                        <div 
                                            onClick={() => { setIsModalOpen(false); setPickerActive('asal'); }}
                                            className="border border-gray-300 rounded-lg p-3 flex justify-between items-center bg-white cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{selectedCell.pegawaiNama}</p>
                                                <p className="text-xs text-gray-500">{selectedCell.tanggal}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${selectedCell.warna || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {selectedCell.shiftKode || 'OFF'}
                                                </span>
                                                <Edit3 size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* IKON PERTUKARAN VISUAL */}
                                    <div className="flex justify-center -my-3 z-10 relative">
                                        <div className="bg-white border border-gray-200 shadow-sm p-1.5 rounded-full text-blue-600">
                                            <ArrowDownUp size={16} />
                                        </div>
                                    </div>

                                    {/* 2. KOTAK SEL TUJUAN */}
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Jadwal Tujuan (Target)</label>
                                        <div 
                                            onClick={() => { setIsModalOpen(false); setPickerActive('tujuan'); }}
                                            className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition-all group ${cellTujuan ? 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-md' : 'border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-600'}`}
                                        >
                                            {cellTujuan ? (
                                                <>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{cellTujuan.pegawaiNama}</p>
                                                        <p className="text-xs text-gray-500">{cellTujuan.tanggal}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${cellTujuan.warna || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {cellTujuan.shiftKode || 'OFF'}
                                                        </span>
                                                        <Edit3 size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-blue-600 text-xs font-bold w-full py-2 text-center flex items-center justify-center gap-2">
                                                    <MousePointerClick size={16} className="animate-bounce" /> KLIK UNTUK MEMILIH SEL DI TABEL
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        label={isSaving ? "Memproses Tukar..." : "Konfirmasi Pertukaran"} 
                                        className="mt-3 w-full" 
                                        disabled={isSaving || !cellTujuan}
                                        onClick={handleProsesTukarShift} 
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================== */}
            {/* MODAL GENERATE MASSAL */}
            {/* ========================================================== */}
            {isModalMassalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95">
                        
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Generate Jadwal Massal</h3>
                                <p className="text-xs text-gray-500 font-semibold mt-0.5">Buat slot jadwal untuk banyak tanggal sekaligus</p>
                            </div>
                            <button onClick={() => setIsModalMassalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            
                            {/* Pilihan Target Pegawai (Dengan Checkbox & Filter Cascading) */}
                            <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Karyawan Target</label>
                                
                                {/* Baris Filter Bersarang (Cascading Dropdown) */}
                                <div className="flex flex-wrap gap-2">
                                    <select 
                                        value={filterLevel1} 
                                        onChange={(e) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            setFilterLevel1(e.target.value as any);
                                            setFilterLevel2("");
                                            setFilterLevel3("");
                                        }}
                                        className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                                    >
                                        <option value="all_karyawan">Semua Karyawan</option>
                                        <option value="filter_departemen">Filter Departemen</option>
                                    </select>

                                    {filterLevel1 === 'filter_departemen' && (
                                        <select 
                                            value={filterLevel2} 
                                            onChange={(e) => {
                                                setFilterLevel2(e.target.value);
                                                setFilterLevel3("");
                                            }} 
                                            className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                                        >
                                            <option value="">-- Pilih Departemen --</option>
                                            {uniqueDepartemen.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                                        </select>
                                    )}

                                    {filterLevel1 === 'filter_departemen' && filterLevel2 !== '' && (
                                        <select 
                                            value={filterLevel3} 
                                            onChange={(e) => setFilterLevel3(e.target.value)} 
                                            className="border border-gray-300 rounded px-2 py-1.5 text-xs outline-none flex-1 min-w-[130px] bg-white"
                                        >
                                            <option value="">-- Pilih Jabatan --</option>
                                            {uniqueJabatanInDept.map(j => <option key={j as string} value={j as string}>{j as string}</option>)}
                                        </select>
                                    )}
                                </div>

                                {/* Kotak Scrollable Checkbox */}
                                <div className="border border-gray-300 bg-white rounded-lg flex flex-col mt-1 shadow-sm">
                                    {/* Opsi Select All Berdasarkan Level yang Aktif */}
                                    <label className="flex items-center gap-2 p-2.5 border-b border-gray-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-800 rounded-t-lg transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isAllVisibleSelected}
                                            onChange={handleSelectAllVisible}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                        />
                                        Pilih Semua ({visiblePegawaiIds.length} Karyawan)
                                    </label>

                                    {/* List Dinamis (Bisa Karyawan, Departemen, atau Jabatan) */}
                                    <div className="max-h-40 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                                        {displayList.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">Data tidak ditemukan.</p>
                                        ) : (
                                            displayList.map(item => (
                                                <label key={item.id} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 cursor-pointer rounded text-sm transition-colors border border-transparent hover:border-blue-100">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isItemSelected(item.pegawaiIds)}
                                                        onChange={() => handleToggleItem(item.pegawaiIds)}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                    />
                                                    <span className="text-gray-800 font-medium">{item.label}</span>
                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 ml-auto border border-gray-200 whitespace-nowrap">
                                                        {item.subLabel}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-[10px] font-bold text-blue-600 text-right mt-1">
                                    ✓ Total Target: {selectedPegawaiIds.length} Karyawan Terpilih
                                </div>
                            </div>
                            {/* Rentang Tanggal */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Dari Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={massalTanggalMulai}
                                        onChange={(e) => setMassalTanggalMulai(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full" 
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sampai Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={massalTanggalSelesai}
                                        onChange={(e) => setMassalTanggalSelesai(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full" 
                                    />
                                </div>
                            </div>

                            {/* Pilihan Shift (Bisa Override / Pakai Default) */}
                            <div className="flex flex-col gap-1.5 mt-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilihan Shift</label>
                                <select 
                                    value={massalShiftId}
                                    onChange={(e) => setMassalShiftId(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full"
                                >
                                    <option value="">-- Gunakan Shift Default Pegawai --</option> {/* <-- LABEL BARU */}
                                    {listMasterShifts.map((shift) => (
                                        <option key={shift.id} value={shift.id}>
                                            OVERRIDE JADI: {shift.kode_shift} ({shift.jam_masuk?.substring(0, 5)} - {shift.jam_pulang?.substring(0, 5)})
                                        </option>
                                    ))}
                                    <option value="off">OVERRIDE JADI: LIBUR (OFF)</option> {/* <-- TAMBAHKAN OPSI LIBUR MASSAL */}
                                </select>
                            </div>

                            <div className="bg-blue-50 text-blue-800 text-[11px] p-3 rounded border border-blue-200 mt-2">
                                💡 Jika jadwal di rentang tanggal tersebut sudah ada, sistem akan otomatis <strong>menimpa (overwrite)</strong> jadwal lama dengan jadwal baru ini.
                            </div>

                            <Button 
                                label={isSaving ? "Memproses Data..." : "Eksekusi Generate"} 
                                className="mt-2 w-full" 
                                disabled={isSaving}
                                onClick={handleProsesGenerateMassal} 
                            />
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}