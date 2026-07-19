import React, { useState, useEffect } from 'react';
import { X, Search, Users, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 animate-in zoom-in-95 my-6">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Assign Pola Rolling Shift Pegawai
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Terapkan siklus rotasi shift & tanggal patokan (Anchor Date) ke pegawai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-semibold">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* KOLOM KIRI: PILIH POLA & DATES */}
            <div className="flex flex-col gap-3">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  1. Pilih Pola Rotasi Shift *
                </label>
                <select
                  value={selectedPolaId}
                  onChange={e => setSelectedPolaId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm bg-white outline-none w-full font-medium"
                  required
                >
                  <option value="">-- Pilih Pola Rotasi --</option>
                  {polaList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama_pola} (Siklus {p.jumlah_hari_siklus} Hari)
                    </option>
                  ))}
                  <option value="NONE">-- Nonaktifkan Pola (Pakai Shift Default) --</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  2. Tanggal Mulai Hari ke-1 (Anchor Date) *
                </label>
                <input
                  type="date"
                  value={tanggalMulaiPola}
                  onChange={e => setTanggalMulaiPola(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full bg-white font-medium"
                  required
                />
                <p className="text-[11px] text-gray-500">
                  💡 Pada tanggal ini, pegawai mulai <strong>Hari ke-1</strong> siklus.
                </p>
              </div>

              {/* SIMULASI SEQUENTIAL PREVIEW */}
              {selectedPolaObj && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Sparkles size={14} />
                    <span>Preview Siklus ({selectedPolaObj.jumlah_hari_siklus} Hari)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPolaObj.detail_pola_rotasi?.map(d => {
                      const shiftObj = shifts.find(s => String(s.id) === String(d.shift_id));
                      const isOff = !d.shift_id;
                      return (
                        <span
                          key={d.urutan_hari}
                          className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                            isOff
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-blue-600 text-white border-blue-600'
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
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateJadwal}
                    onChange={e => setAutoGenerateJadwal(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Langsung Generate Slot Jadwal Ke Kalender</span>
                </label>

                {autoGenerateJadwal && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-600">
                      Generate Langsung Sampai Tanggal:
                    </label>
                    <input
                      type="date"
                      value={generateSampai}
                      onChange={e => setGenerateSampai(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* KOLOM KANAN: PEGAWAI TARGET SELECTOR */}
            <div className="flex flex-col gap-2">
              
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  3. Pilih Pegawai Target ({selectedPegawaiIds.length} Terpilih)
                </label>
              </div>

              {/* Filter Dept & Search */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-800 outline-none focus:border-blue-500"
                >
                  <option value="">Semua Dept</option>
                  {uniqueDepartemen.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* List Box Pegawai */}
              <div className="border border-gray-300 bg-white rounded-lg flex flex-col shadow-sm flex-1 min-h-[220px]">
                
                {/* Select All Bar */}
                <label className="flex items-center gap-2 p-2.5 border-b border-gray-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-800 rounded-t-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  Pilih Semua ({filteredPegawai.length} Pegawai)
                </label>

                {/* Items Container */}
                <div className="p-2 space-y-1 overflow-y-auto max-h-52 flex-1">
                  {filteredPegawai.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Pegawai tidak ditemukan.
                    </div>
                  ) : (
                    filteredPegawai.map(p => {
                      const isChecked = selectedPegawaiIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors border border-transparent ${
                            isChecked
                              ? 'bg-blue-50 text-blue-900 font-semibold border-blue-100'
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePegawai(p.id)}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                            />
                            <span className="truncate">{p.nama}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
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
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              label="Batal"
              variant="secondary"
              onClick={onClose}
            />
            <Button
              label={isSaving ? "Memproses Penugasan..." : "Terapkan Pola Rotasi"}
              variant="success"
              type="submit"
              isLoading={isSaving}
            />
          </div>

        </form>
      </div>
    </div>
  );
};
