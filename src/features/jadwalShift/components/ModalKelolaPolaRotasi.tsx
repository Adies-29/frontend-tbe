import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';

interface Shift {
  id: string;
  kode_shift: string;
  jam_masuk: string;
  jam_pulang: string;
}

interface DetailPola {
  urutan_hari: number;
  shift_id: string | null;
}

interface PolaRotasi {
  id?: string;
  nama_pola: string;
  jumlah_hari_siklus: number;
  keterangan?: string;
  detail_pola_rotasi?: DetailPola[];
}

interface ModalKelolaPolaRotasiProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  token: string;
  onSuccess?: () => void;
}

export const ModalKelolaPolaRotasi: React.FC<ModalKelolaPolaRotasiProps> = ({
  isOpen,
  onClose,
  shifts,
  token,
  onSuccess
}) => {
  const storeToken = useAuthStore((state) => state.token);
  const activeToken = token || storeToken;
  const [polaList, setPolaList] = useState<PolaRotasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode Form: 'list' atau 'create'
  const [mode, setMode] = useState<'list' | 'create'>('list');

  // Form State
  const [namaPola, setNamaPola] = useState('');
  const [jumlahHari, setJumlahHari] = useState(7);
  const [keterangan, setKeterangan] = useState('');
  const [details, setDetails] = useState<DetailPola[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPolaList();
      resetForm();
    }
  }, [isOpen]);

  const fetchPolaList = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await apiFetch(`${baseUrl}/api/v1/pola-rotasi`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const json = await res.json();
      if (json.success) {
        setPolaList(json.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching pola rotasi:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNamaPola('');
    setJumlahHari(7);
    setKeterangan('');
    generateDefaultDetails(7);
    setMode('list');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const generateDefaultDetails = (count: number) => {
    const arr: DetailPola[] = [];
    for (let i = 1; i <= count; i++) {
      arr.push({ urutan_hari: i, shift_id: shifts[0]?.id || null });
    }
    setDetails(arr);
  };

  const handleJumlahHariChange = (newCount: number) => {
    const count = Math.max(1, Math.min(30, newCount));
    setJumlahHari(count);

    setDetails(prev => {
      const next: DetailPola[] = [];
      for (let i = 1; i <= count; i++) {
        const existing = prev.find(p => p.urutan_hari === i);
        next.push(existing || { urutan_hari: i, shift_id: shifts[0]?.id || null });
      }
      return next;
    });
  };

  const handleShiftSelect = (urutanHari: number, shiftId: string) => {
    setDetails(prev =>
      prev.map(d =>
        d.urutan_hari === urutanHari ? { ...d, shift_id: shiftId === 'OFF' ? null : shiftId } : d
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!namaPola.trim()) {
      setErrorMsg('Nama pola rotasi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await apiFetch(`${baseUrl}/api/v1/pola-rotasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          nama_pola: namaPola,
          jumlah_hari_siklus: jumlahHari,
          keterangan,
          details
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Pola rotasi shift berhasil dibuat!');
        fetchPolaList();
        setMode('list');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(json.message || 'Gagal menyimpan pola rotasi.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pola rotasi ini?')) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await apiFetch(`${baseUrl}/api/v1/pola-rotasi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const json = await res.json();
      if (json.success) {
        fetchPolaList();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Gagal menghapus pola rotasi:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Kelola Pola Rolling Shift Dinamis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

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

          {mode === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Daftar Master Pola Siklus Rotasi Shift yang Tersedia
                </p>
                <button
                  onClick={() => setMode('create')}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pola Baru</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-slate-400">Memuat data pola rotasi...</div>
              ) : polaList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  Belum ada pola rotasi shift. Klik "Tambah Pola Baru" untuk membuat siklus baru.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1">
                  {polaList.map(pola => (
                    <div
                      key={pola.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {pola.nama_pola}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Siklus {pola.jumlah_hari_siklus} Hari | {pola.keterangan || 'Tanpa keterangan'}
                          </p>
                        </div>
                        <button
                          onClick={() => pola.id && handleDelete(pola.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          title="Hapus Pola"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Detail Days Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {pola.detail_pola_rotasi?.map(d => {
                          const shiftObj = shifts.find(s => s.id === d.shift_id);
                          const isOff = !d.shift_id;
                          return (
                            <span
                              key={d.urutan_hari}
                              className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                                isOff
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              H{d.urutan_hari}: {isOff ? 'OFF' : shiftObj?.kode_shift || 'Shift'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Form Mode Create */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pola Rotasi *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Siklus 8 Hari (2P-2S-2M-2OFF)"
                    value={namaPola}
                    onChange={e => setNamaPola(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Panjang Siklus (Jumlah Hari) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={jumlahHari}
                    onChange={e => handleJumlahHariChange(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Catatan operasional pola rotasi"
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Grid Days Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Atur Shift Hari ke-1 s/d Hari ke-{jumlahHari} dalam Siklus:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {details.map(d => (
                    <div
                      key={d.urutan_hari}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                        Hari ke-{d.urutan_hari}
                      </span>
                      <select
                        value={d.shift_id || 'OFF'}
                        onChange={e => handleShiftSelect(d.urutan_hari, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="OFF">OFF (Libur)</option>
                        {shifts.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.kode_shift} ({s.jam_masuk.slice(0, 5)}-{s.jam_pulang.slice(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Pola Rotasi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
