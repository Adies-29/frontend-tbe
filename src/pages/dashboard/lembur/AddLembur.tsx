import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import Button from "../../../components/ui/Button";



export default function AddLembur(){
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const token = useAuthStore((state) => state.token);
    const userToken = useAuthStore((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);

    const idPegwai = searchParams.get("pegawai_id") || "";
    const namaPegawai = searchParams.get("nama") || "";

    const [formData, setFormData] = useState({
        pegawai_id: idPegwai,
        tanggal: "",
        menit_lembur_diizinkan: "",
        disetujui_oleh: userToken || "",
        alasan_lembur: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("https://ppm-sooty.vercel.app/api/lembur/spl", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("SPL Berhasil Dibuat!");
                navigate("/dashboard"); 
            } else {
                alert("Gagal membuat SPL. Cek input kembali.");
            }
        } catch (error) {
           console.error("Error creating lembur:", error);
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsLoading(false);
        }
    };
return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium">
                <ArrowLeft size={18} /> Kembali
            </button>

            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="text-red-600" /> Buat Perintah Lembur Baru
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
         
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID Pegawai <span className="text-red-500">*</span></label>
                    <input 
                        required
                        className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none ${idPegwai ? "bg-gray-100 text-gray-600" : ""}`}
                        value={formData.pegawai_id}
                        readOnly={!!idPegwai}
                        onChange={(e) => setFormData({...formData, pegawai_id: e.target.value})}
                    />
                    {namaPegawai && (
                        <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center gap-1">
                            Membuat SPL untuk: <strong>{namaPegawai}</strong>
                        </p>
                    )}
                </div>


                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Lembur <span className="text-red-500">*</span></label>
                    <input 
                        type="date"
                        required
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    />
                </div>

           
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lama Lembur (Menit) <span className="text-red-500">*</span></label>
                    <input 
                        type="number"
                        required
                        min="1"
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                        placeholder="Contoh: 120"
                        value={formData.menit_lembur_diizinkan}
                        onChange={(e) => setFormData({...formData, menit_lembur_diizinkan: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alasan Lembur <span className="text-gray-400 font-normal text-xs">(Opsional)</span></label>
                    <textarea 
                        className="w-full p-2.5 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-red-200 focus:outline-none resize-none"
                        placeholder="Tuliskan alasan lembur di sini jika ada..."
                        value={formData.alasan_lembur}
                        onChange={(e) => setFormData({...formData, alasan_lembur: e.target.value})}
                    />
                </div>

                <Button
                variant="success"
                type="submit"
                disabled={isLoading}
                label={isLoading ? "Menyimpan..." : "Simpan"}
            />

            </form>
        </div>
    );
}
