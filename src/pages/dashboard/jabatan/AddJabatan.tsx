import { useNavigate } from 'react-router-dom';
import { ArrowLeft} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/InputText'; 
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import Notif from '../../../components/ui/Notif';


const schema = z.object({
    nama_jabatan: z.string().min(2, "Nama Jabatan minimal 2 karakter"),
    departemen_id: z.string().min(1, "Departemen wajib dipilih"),
});

type FormData = z.infer<typeof schema>;
interface DepartemenItem {
    id: string;
    nama_departemen: string;
}

export default function AddJabatan() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [departemenList, setDepartemenList] =  useState<DepartemenItem[]>([]);
    const token = useAuthStore((state) => state.token)

    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    //Mengambil data departemen
    useEffect(() => {
        const fetchDepartemen = async () =>{
            try {
                const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/departemen`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                });
                
                const result = await response.json();

                if (response.ok){
                    setDepartemenList(result.data)
                }
            } catch (error) {
                console.error("Gagal mengambil data departemen:", error);
            }
        };
        fetchDepartemen();
    }, []);


    // tombol Simpan diklik
   const onSubmit = async (data: FormData) => {
        setIsSaving(true)
        try {
            const response = await fetch("https://ppm-sooty.vercel.app/api/v1/jabatan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_jabatan: data.nama_jabatan,
                    departemen_id: parseInt(data.departemen_id)
                }),
            });
            const result = await response.json();

           if (response.ok && result.success) {
                setNotif({ show: true, message: "Jabatan berhasil disimpan!", type: "success" });
                setTimeout(() => {
                    navigate("/dashboard/jabatan"); 
                }, 2000)
            } else {
                setNotif({ show: true, message: "Gagal menyimpan ke database. Coba lagi.", type: "error" });
            }
        } catch (error: any) {
            console.error("Error Submit:", error);
            setNotif({ show: true, message: "Terjadi kesalahan jaringan.", type: "error" });
        }finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xlmx-auto w-full">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                {/* HEADER HALAMAN */}
                <div className="flex grid-cols-1 md:grid-cols-2 justify-between">

                    <h2  className="text-2xl font-bold text-gray-800 mb-6">Tambah Jabatan Baru</h2>

                    <Button
                        variant="back"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>

                {/* FORM TAMBAH JABATAN */}

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
                    <div>
                        {/* Input Nama Jabatan */}
                        <Input
                            label="Nama Jabatan"
                            nama="nama_jabatan"
                            type="text"
                            register={register}
                            error={errors.nama_jabatan?.message}
                        />

                        {/* Input Dropdown Departemen (Native HTML Select dg styling Tailwind) */}
                        <div className="flex flex-col gap-1 mb-4">
                            <label htmlFor="departemen_id" className="text-sm font-medium text-gray-700">
                                Pilih Departemen
                            </label>
                            <select
                                {...register("departemen_id")}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white
                                ${errors.departemen_id ? 'border-red-500' : 'border-gray-300'}`}
                                defaultValue=""
                            >
                                <option value="">-- Pilih Departemen --</option>
                                {departemenList.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.nama_departemen}
                                    </option>
                                ))}
                            </select>
                            {errors.departemen_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.departemen_id.message}</p>
                            )}
                        </div>

                        {/* AREA TOMBOL */}
                        <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-gray-200">
                            <Button
                                variant="success"
                                type="submit"
                                label={isSaving ? "Menyimpan..." : "SImpan"}
                            />
                            <Button
                                type="button"
                                variant="danger"
                                label="Batal"
                                onClick={() => navigate(-1)}
                            />

                        </div>

                    </div>
                </form>
            </div>
            <Notif
                show={notif.show}
                message={notif.message}
                type={notif.type}
                onClose={() => setNotif({ show: false, message: "", type: "success" })}
            />
        </div>
    );
}