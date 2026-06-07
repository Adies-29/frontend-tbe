import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Button from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../components/ui/InputText";
import { useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import Notif from "../../../components/ui/Notif";




const schema = z.object({
    nama: z.string().min(1, "Nama Departemen harus diisi"),

});

type FormData = z.infer<typeof schema>;


export default function AddDepartemen() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
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
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);

        try {
            const response = await fetch("https://ppm-sooty.vercel.app/api/v1/departemen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    nama_departemen: data.nama
                }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setNotif({ show: true, message: "Departemen berhasil disimpan!", type: "success" });
                setTimeout(() => {
                    navigate("/dashboard/departemen")
                }, 2000)
            } else {
                setNotif({ show: true, message: "Gagal menyimpan ke database. Coba lagi.", type: "error" });
            }
        } catch (error) {
            console.error("Error Submit:", error);
            setNotif({ show: true, message: "Terjadi kesalahan jaringan.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };



    return (
        <div className="p-6 max-w-2xlmx-auto w-full">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">

                <div className="flex grid-cols-1 md:grid-cols-2 justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Tambah Departemen
                    </h2>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={24} />}
                        onClick={() => navigate(-1)}
                        label="Kembali" // Walau teksnya disembunyikan, ini muncul sbg tooltip kalau di-hover!
                    />

                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

                    <div>

                        <Input
                            label="Nama Departemen"
                            nama="nama"
                            register={register}
                            error={errors.nama?.message}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-gray-200">
                        <Button
                            variant="success"
                            type="submit"
                            label={isSaving ? "Menyimpan.." : "Simpan"}

                        />
                        <Button
                            type="button"
                            variant="danger"
                            label="Batal"
                            onClick={() => navigate(-1)}
                        />
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