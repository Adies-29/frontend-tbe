import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, RefreshCw, CheckCircle, AlertCircle, Users, Sparkles } from 'lucide-react';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';

interface Shift {
  id: string;
  kode_shift: string;
}

interface DetailPola {
  urutan_hari: number;
  shift_id: string | null;
  shifts?: { kode_shift: string };
}

interface PolaRotasi {
  id: string;
  nama_pola: string;
  jumlah_hari_siklus: number;
  keterangan?: string;
  detail_pola_rotasi?: DetailPola[];
}

interface Pegawai {
  id: number;
  nama: string;
  nik?: string;
  pola_rotasi_id?: string;
  tanggal_mulai_pola?: string;
  jabatan?: { nama_jabatan: string; departemen?: { nama_departemen: string } };
  departemen?: { nama_departemen: string };
}

interface ModalAssignPolaPegawaiProps {
  isOpen: boolean;
  onClose: () => void;
  listPegawai: Pegawai[];
  shifts: Shift[];
  onSuccess?: () => void;
}

export const ModalAssignPolaPegawai: React.FC<ModalAssignPolaPegawaiProps> = ({
  isOpen,
  onClose,
  listPegawai,
  shifts,
  onSuccess
}) => {
  const token = useAuthStore((state) => state.token);

  const [polaList, setPolaList] = useState<PolaRotasi[]>([]);
  const [selectedPolaId, setSelectedPolaId] = useState<string>('');
  const [tanggalMulaiPola, setTanggalMulaiPola] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [autoGenerateJadwal, setAutoGenerateJadwal] = useState(true);
  const [generateSampai, setGenerateSampai] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-CA');
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPolaList();
      setSelectedPegawaiIds([]);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const fetchPolaList = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await apiFetch(`${baseUrl}/api/v1/pola-rotasi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setPolaList(json.data || []);
        if (json.data?.length > 0 && !selectedPolaId) {
          setSelectedPolaId(json.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Gagal memuat pola rotasi:', err);
    }
  };

  const getDeptName = (p: Pegawai) =>
    p.departemen?.nama_departemen || p.jabatan?.departemen?.nama_departemen || 'Umum';

  const uniqueDepartemen = Array.from(new Set(listPegawai.map(getDeptName)));

  const filteredPegawai = listPegawai.filter(p => {
    const matchDept = !filterDept || getDeptName(p) === filterDept;
    const matchSearch =
      !searchQuery ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nik && p.nik.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDept && matchSearch;
  });

  const isAllSelected =
    filteredPegawai.length > 0 &&
    filteredPegawai.every(p => selectedPegawaiIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPegawaiIds(prev =>
        prev.filter(id => !filteredPegawai.some(p => p.id === id))
      );
    } else {
      const idsToAdd = filteredPegawai.map(p => p.id);
      setSelectedPegawaiIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const handleTogglePegawai = (id: number) => {
    setSelectedPegawaiIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedPolaObj = polaList.find(p => p.id === selectedPolaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedPegawaiIds.length === 0) {
      setErrorMsg('Pilih minimal 1 pegawai target.');
      return;
    }

    if (!selectedPolaId) {
      setErrorMsg('Pilih pola rotasi yang akan diterapkan.');
      return;
    }

    if (!tanggalMulaiPola) {
      setErrorMsg('Tanggal mulai pola (Anchor Date) wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

      // 1. Update data pegawai (pola_rotasi_id & tanggal_mulai_pola)
      let countSuccess = 0;
      for (const pId of selectedPegawaiIds) {
        const res = await apiFetch(`${baseUrl}/api/v1/pegawai/${pId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            pola_rotasi_id: selectedPolaId === 'NONE' ? null : selectedPolaId,
            tanggal_mulai_pola: tanggalMulaiPola
          })
        });

        const json = await res.json();
        if (json.success) countSuccess++;
      }

      // 2. Eksekusi Auto-Generate Jadwal Instan (Opsional)
      if (autoGenerateJadwal && selectedPolaId !== 'NONE') {
        await apiFetch(`${baseUrl}/api/v1/jadwal/generate-massal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            list_pegawai_ids: selectedPegawaiIds,
            tanggal_mulai: tanggalMulaiPola,
            tanggal_selesai: generateSampai
          })
        });
      }

      setSuccessMsg(
        `Berhasil menerapkan pola rotasi ke ${countSuccess} pegawai!`
      );
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err: any) {
      setErrorMsg('Gagal menerapkan pola rotasi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Penugasan Pola Rolling Shift Pegawai
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Atur siklus rotasi shift dan tanggal patokan (Anchor Date) pegawai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* KOLOM KIRI: PILIH POLA & DATES */}
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  1. Pilih Pola Rotasi Shift Target *
                </label>
                <select
                  value={selectedPolaId}
                  onChange={e => setSelectedPolaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-sm"
                  required
                >
                  <option value="">-- Pilih Pola Rotasi --</option>
                  {polaList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama_pola} (Siklus {p.jumlah_hari_siklus} Hari)
                    </option>
                  ))}
                  <option value="NONE">-- Nonaktifkan Pola Rotasi (Pakai Shift Tetap) --</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  2. Tanggal Mulai Hari ke-1 (Anchor Date) *
                </label>
                <input
                  type="date"
                  value={tanggalMulaiPola}
                  onChange={e => setTanggalMulaiPola(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Pada tanggal ini, pegawai secara resmi memulai <strong>Hari ke-1</strong> dari pola rotasi pilihan.
                </p>
              </div>

              {/* SIMULASI SEQUENTIAL PREVIEW */}
              {selectedPolaObj && (
                <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Preview Rangkaian Siklus ({selectedPolaObj.jumlah_hari_siklus} Hari)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPolaObj.detail_pola_rotasi?.map(d => {
                      const shiftObj = shifts.find(s => String(s.id) === String(d.shift_id));
                      const isOff = !d.shift_id;
                      return (
                        <span
                          key={d.urutan_hari}
                          className={`text-[11px] px-2 py-1 rounded-md font-semibold ${
                            isOff
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              : 'bg-indigo-600 text-white shadow-xs'
                          }`}
                        >
                          H{d.urutan_hari}: {isOff ? 'OFF' : shiftObj?.kode_shift || 'Shift'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OPSIONAL: AUTO GENERATE INSTANT */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateJadwal}
                    onChange={e => setAutoGenerateJadwal(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Langsung Generate Slot Jadwal ke Kalender</span>
                </label>

                {autoGenerateJadwal && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Generate Langsung Sampai Tanggal:
                    </label>
                    <input
                      type="date"
                      value={generateSampai}
                      onChange={e => setGenerateSampai(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* KOLOM KANAN: PEGAWAI TARGET SELECTOR */}
            <div className="space-y-3 flex flex-col">
              
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  3. Pilih Pegawai Target ({selectedPegawaiIds.length} Terpilih)
                </label>
              </div>

              {/* Filter Dept & Search */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Semua Dept</option>
                  {uniqueDepartemen.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* List Box Pegawai */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex-1 bg-white dark:bg-slate-800 flex flex-col min-h-[220px]">
                
                {/* Select All Bar */}
                <label className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Pilih Semua ({filteredPegawai.length} Pegawai)</span>
                </label>

                {/* Items Container */}
                <div className="p-2 space-y-1 overflow-y-auto max-h-56 flex-1">
                  {filteredPegawai.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Pegawai tidak ditemukan.
                    </div>
                  ) : (
                    filteredPegawai.map(p => {
                      const isChecked = selectedPegawaiIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePegawai(p.id)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="truncate">{p.nama}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-2">
                            {p.jabatan?.nama_jabatan || getDeptName(p)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Submit Action Bar */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Penugasan...</span>
                </>
              ) : (
                <span>Terapkan Pola Rotasi</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
