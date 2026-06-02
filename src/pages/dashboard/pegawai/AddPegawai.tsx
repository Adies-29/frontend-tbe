import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";

import { TextArea } from "../../../components/ui/TextArea";
import InputSelect from "../../../components/ui/InputSelect";
import { Input } from "../../../components/ui/InputText";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";



// 2. REVISI SCHEMA ZOD 
const schema = z.object({
    nik: z.string().optional(),
    nama: z.string().min(1, "Nama Karyawan harus diisi"),
    nohp: z.string().min(1, "Nomor HP harus diisi"),
    no_hp: z.string().optional(),
    alamat: z.string().min(1, "Alamat Karyawan harus diisi"),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    pin_mesin: z.string().min(1, "PIN wajib diisi"),
    departemen: z.string().min(1, "Departemen harus dipilih"),
    // ID Relasi
    jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
    default_shift_id: z.string().min(1, "Shift wajib dipilih"),
});
type FormData = z.infer<typeof schema>;


export default function AddPegawai() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [isLoading, setIsLoading] = useState(false);
    const [departemenList, setDepartemenList] = useState<any[]>([]);
    const [shiftList, setShiftList] = useState<any[]>([]);
    const [allJabatan, setAllJabatan] = useState<any[]>([]);
    const [jabatanList, setJabatanList] = useState<any[]>([]);
    
    // Tambahkan watch dan setValue di sini
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    
    useEffect(() =>{
        const fetctPegawai = async () => {
            try {
               const [resDept, resJabatan, resShift] = await Promise.all([
                    fetch("http://localhost:3000/api/v1/departemen", { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch("http://localhost:3000/api/v1/jabatan", { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch("http://localhost:3000/api/v1/shifts", { headers: { "Authorization": `Bearer ${token}` } })
                ]);
                const dataDept = await resDept.json();
                const dataJabatan = await resJabatan.json();
                const dataShift = await resShift.json();

                if (resDept.ok && dataDept.success) setDepartemenList(dataDept.data);
                if (resJabatan.ok && dataJabatan.success) setAllJabatan(dataJabatan.data);
                if (resShift.ok && dataShift.success) setShiftList(dataShift.data);
                
            } catch (error) {
                console.error("Gagal memuat master data:", error);
            }
        };
        fetctPegawai();
    }, [token]);
    
    const selectedDept = watch("departemen"); // Menangkap ID departemen yang dipilih

    useEffect(() => {
        if(selectedDept) {
            console.log("--- PROSES FILTER DIJALANKAN ---");
            console.log("ID Dept Yang Dipilih HRD:", selectedDept);
            console.log("Data Semua Jabatan Yang Tersedia:", allJabatan);

            const pilih = allJabatan.filter((j) => {
                // 👇 INTIP APAKAH KOLOM 'departemen_id' BENAR-BENAR ADA DI OBJEK JABATAN
                console.log("Membandingkan ID Dept di Jabatan:", j.departemen_id, "dengan", selectedDept);
                return j.departemen_id?.toString() === selectedDept.toString()      
            });

            setJabatanList(pilih);
            setValue("jabatan_id", "");
        } else{
            setJabatanList([]);
        }
    }, [selectedDept, allJabatan, setValue]);
    
    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        try {
            const response = await fetch ("http://localhost:3000/api/v1/pegawai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nik: data.nik,
                    nama: data.nama,
                    no_hp: data.no_hp,
                    alamat: data.alamat,
                    email: data.email,
                    pin_mesin: data.pin_mesin || null,
                    jabatan_id: parseInt(data.jabatan_id),
                    default_shift_id: parseInt(data.default_shift_id),
                }),
            });

            const result = await response.json();

            if(response.ok && result.success){
                alert(`Sukses! Karyawan baru telah disimpan dengan ID: ${result.data.id}`);
                navigate("/dashboard/data-karyawan");
            }else{
                alert(result.message || "Gagal menambahkan karyawan.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
        }finally{
            setIsLoading(false);
        }
    }

    
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Tambah Karyawan
                    </h2>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={24} />}
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="NIK Karyawan"
                            nama="nik"
                            register={register}
                            error={errors.nik?.message}
                        />
                        <Input
                            label="Nama Karyawan"
                            nama="nama"
                            register={register}
                            error={errors.nama?.message}
                        />
                        <Input
                            label="Nomor HP"
                            nama="nohp"
                            register={register}
                            error={errors.nohp?.message}
                        />

                        <InputSelect
                            label="Departemen"
                            nama="departemen"
                            register={register}
                            error={errors.departemen?.message}
                            options={departemenList.map(dept => ({
                                value: dept.id,
                                label: dept.nama_departemen
                            }))}
                        />
                        <InputSelect
                            label="Jabatan"
                            nama="jabatan_id"
                            register={register}
                            error={errors.jabatan_id?.message}
                            options={jabatanList.map((jabatan) => ({
                                value: jabatan.id,
                                label: jabatan.nama_jabatan
                            }))}
                            disabled={!selectedDept}
                        />

                        <InputSelect
                            label="Shift"
                            nama="default_shift_id" 
                            register={register}
                            error={errors.default_shift_id?.message}
                            options={shiftList.map((shift) => ({
                                value: shift.id,
                                label: shift.kode_shift || shift.nama_shift || `Shift ${shift.id}`
                            }))}
                        />
                        <Input
                            label="PIN Mesin Absensi *"
                            nama="pin_mesin"
                            register={register}
                            error={errors.pin_mesin?.message}
                        />

                        <TextArea
                            label="Alamat"
                            name="alamat"
                            register={register}
                            error={errors.alamat?.message}
                            className="md:col-span-2"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-5">
                        <Button type="submit" label="Simpan" disabled={isLoading} />
                        <Button
                            type="button"
                            variant="secondary"
                            label="Batal"
                            onClick={() => navigate(-1)}
                            disabled={isLoading}
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}