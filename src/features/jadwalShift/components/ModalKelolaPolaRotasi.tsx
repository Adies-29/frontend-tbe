import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import { apiFetch } from '../../../utils/apiFetch';
import { useAuthStore } from '../../../store/useAuthStore';

interface Shift {
  id: string | number;
  kode_shift: string;
  jam_masuk?: string;
  jam_pulang?: string;
}

interface DetailPola {
  urutan_hari: number;
  shift_id: string | number | null;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-blue-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Master Pola Rolling Shift
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Kelola master siklus rotasi shift pegawai
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

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-semibold">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 font-medium">
                  Daftar Master Siklus Rotasi Shift yang Tersedia:
                </p>
                <Button
                  label="Buat Pola Baru"
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setMode('create')}
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-xs text-gray-400 font-medium">Memuat data pola rotasi...</div>
              ) : polaList.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  Belum ada pola rotasi shift. Klik "Buat Pola Baru" untuk membuat siklus baru.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-1">
                  {polaList.map(pola => (
                    <div
                      key={pola.id}
                      className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-blue-300 transition-colors flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            {pola.nama_pola}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            Siklus {pola.jumlah_hari_siklus} Hari {pola.keterangan ? `• ${pola.keterangan}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => pola.id && handleDelete(pola.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Pola"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Detail Days Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                        {pola.detail_pola_rotasi?.map(d => {
                          const shiftObj = shifts.find(s => String(s.id) === String(d.shift_id));
                          const isOff = !d.shift_id;
                          return (
                            <span
                              key={d.urutan_hari}
                              className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                                isOff
                                  ? 'bg-gray-100 text-gray-600 border-gray-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Nama Pola Rotasi *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Siklus 8 Hari (2P-2S-2M-2OFF)"
                    value={namaPola}
                    onChange={e => setNamaPola(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full bg-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Panjang Siklus (Jumlah Hari) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={jumlahHari}
                    onChange={e => handleJumlahHariChange(parseInt(e.target.value) || 1)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Keterangan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Catatan operasional pola rotasi"
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 shadow-sm outline-none w-full bg-white"
                />
              </div>

              {/* Grid Days Builder */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Atur Shift Hari ke-1 s/d Hari ke-{jumlahHari} dalam Siklus:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1">
                  {details.map(d => (
                    <div
                      key={d.urutan_hari}
                      className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-1"
                    >
                      <span className="text-xs font-bold text-gray-700">
                        Hari ke-{d.urutan_hari}
                      </span>
                      <select
                        value={d.shift_id || 'OFF'}
                        onChange={e => handleShiftSelect(d.urutan_hari, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-800 focus:border-blue-500 outline-none"
                      >
                        <option value="OFF">OFF (Libur)</option>
                        {shifts.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.kode_shift} ({s.jam_masuk?.slice(0, 5)}-{s.jam_pulang?.slice(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button
                  label="Batal"
                  variant="secondary"
                  onClick={resetForm}
                />
                <Button
                  label={loading ? "Menyimpan..." : "Simpan Pola Rotasi"}
                  variant="success"
                  type="submit"
                  isLoading={loading}
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
