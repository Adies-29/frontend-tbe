import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm, Controller } from 'react-hook-form'; 
import Autocomplete from '@mui/material/Autocomplete'; 
import TextField from '@mui/material/TextField'; 

import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";

import { TextArea } from "../../../components/common/TextArea";
import InputSelect from "../../../components/common/InputSelect";
import { Input } from "../../../components/common/InputText";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import Notif from "../../../components/common/Notif";
import { apiFetch } from "../../../utils/apiFetch";
import type { JabatanOption, KotaOption } from "../../../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



// 2. REVISI SCHEMA ZOD 
const schema = z.object({
    nik: z.string()
        .regex(/^\d*$/, "NIK hanya boleh berisi angka")
        .refine((val) => val === "" || val.length === 16, "NIK harus tepat 16 digit")
        .optional(),
    bpjs: z.string()
        .regex(/^\d*$/, "No BPJS hanya boleh berisi angka")
        .refine((val) => val === "" || (val.length >= 11 && val.length <= 13), "No BPJS tidak valid (11-13 digit)")
        .optional(),
    tanggal_bergabung: z.string().min(1, "Tanggal bergabung harus diisi"),
    jenis_kelamin: z.string().min(1, "Jenis Kelamin harus diisi"),
    nama: z.string().min(1, "Nama Pegawai harus diisi"),
    tempat_lahir: z.string().optional().or(z.literal("")),
    tanggal_lahir: z.string().optional().or(z.literal("")),
    no_hp: z.string()
        .regex(/^\d*$/, "Nomor HP hanya boleh berisi angka")
        .refine((val) => val === "" || (val.length >= 10 && val.length <= 14), "Nomor HP tidak valid (10-14 digit)")
        .optional(),
    alamat: z.string().min(1, "Alamat Pegawai harus diisi"),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    pin_mesin: z.string().min(1, "PIN wajib diisi"),
    departemen: z.string().min(1, "Departemen harus dipilih"),
    // ID Relasi
    jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
    default_shift_id: z.string().min(1, "Shift wajib dipilih"),
});
type FormData = z.infer<typeof schema>;

const MOCK_KOTA = [
    { id: 1, nama_kota: "Tegal" },
    { id: 2, nama_kota: "Kab.Tegal" },
    { id: 3, nama_kota: "Bandung" },
    { id: 4, nama_kota: "Jakarta" },
    { id: 5, nama_kota: "Semarang" },
    { id: 6, nama_kota: "Yogyakarta" },
    { id: 7, nama_kota: "Malang" },
    { id: 8, nama_kota: "Makassar" },
];


export default function AddPegawai() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [jabatanList, setJabatanList] = useState<JabatanOption[]>([]);
    const [kotaList, _setKotaList] = useState<KotaOption[]>(MOCK_KOTA); 
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });
    const queryClient = useQueryClient();

    // Tambahkan watch dan setValue di sini
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    
    
        const { data: masterData } = useQuery({
        queryKey: ['masterDataPegawai'],
        queryFn: async () => {
            const [resDept, resJabatan, resShift] = await Promise.all([
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/departemen`, { headers: { "Authorization": `Bearer ${token}` } }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/jabatan`, { headers: { "Authorization": `Bearer ${token}` } }),
                apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, { headers: { "Authorization": `Bearer ${token}` } }),
            ]);
            
            const dept = await resDept.json();
            const jab = await resJabatan.json();
            const shift = await resShift.json();
            
            return {
                departemen: dept.success ? dept.data : [],
                jabatan: jab.success ? jab.data : [],
                shift: shift.success ? shift.data : []
            };
        }
    });

    // Otomatis ter-update jika data sudah selesai di-fetch oleh React Query
    const departemenList = masterData?.departemen || [];
    const allJabatan = masterData?.jabatan || [];
    const shiftList = masterData?.shift || [];

    
    const selectedDept = watch("departemen"); // Menangkap ID departemen yang dipilih

    useEffect(() => {
        if(selectedDept) {

            const pilih = allJabatan.filter((j: any) => {
               

                return j.departemen_id?.toString() === selectedDept.toString()      
            });

            setJabatanList(pilih);
            setValue("jabatan_id", "");
        } else{
            setJabatanList([]);
        }
    }, [selectedDept, allJabatan, setValue]);

    const addPegawaiMutation = useMutation({
        mutationFn: async(data: FormData) => {
            const respons = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pegawai`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                body: JSON.stringify({
                    nik: data.nik || null,
                    bpjs: data.bpjs || null,
                    tanggal_bergabung: data.tanggal_bergabung,
                    jenis_kelamin: data.jenis_kelamin,
                    nama: data.nama,
                    tempat_lahir: data.tempat_lahir || null,
                    tanggal_lahir: data.tanggal_lahir || null,
                    no_hp: data.no_hp,
                    alamat: data.alamat,
                    email: data.email || null,
                    pin_mesin: data.pin_mesin || null,
                    jabatan_id: parseInt(data.jabatan_id),
                    default_shift_id: parseInt(data.default_shift_id),
                }),
            });
            const result = await respons.json();

            if(!respons.ok || !result.success){

                let errorMsg = "Gagal menyimpan ke database. Coba lagi.";
                
                if (result.message) {
                    errorMsg = result.message;
                } else if (result.error) {
                    errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
                } else if (result.errors) {
                    // Jika error berupa array/object (misal hasil validasi form dari backend)
                    errorMsg = Object.values(result.errors).flat().join(", ");
                }
                const lowerError = errorMsg.toLowerCase();
                if (lowerError.includes("duplicate") || lowerError.includes("sudah terdaftar") || lowerError.includes("already exists") || lowerError.includes("unique")) {
                    errorMsg = `Data sudah digunakan! Pastikan NIK, No BPJS, No HP, Email, atau PIN Mesin tidak sama dengan pegawai lain. (Server: ${errorMsg})`;
                }
                throw new Error(errorMsg);
            }
            return result.data;
        },
        onSuccess: (data) => {
            setNotif({ show: true, message: `Sukses! Pegawai baru disimpan (ID: ${data.id})`, type: "success" });
            queryClient.invalidateQueries({queryKey: ['pegawai']});
            setTimeout(() => {
                 navigate("/dashboard/data-pegawai");
            }, 2000)
        },
        onError: (error) => {
             setNotif({ show: true, message: error.message, type: "error" });
        }

    })

    
    const onSubmit = (data: FormData) => {
       addPegawaiMutation.mutate(data);
    }

    
    return (
        
        <div className="p-3 md:p-6 w-full"> 
            
        
            <div data-tour="add-pegawai-form" className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">
                
                {/* --- HEADER --- */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        Tambah Pegawai
                    </h2>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={20} />} 
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* --- SEKSI 1: INFORMASI PRIBADI --- */}
                    <div data-tour="add-pegawai-pribadi">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 md:mb-5">
                            Informasi Pribadi
                        </h3>
                        {/* Jarak antar kotak (gap) dibuat lebih rapat di HP (gap-4) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <Input label="NIK Pegawai" nama="nik" register={register} error={errors.nik?.message} />
                            <Input label="No BPJS Pegawai" nama="bpjs" register={register} error={errors.bpjs?.message}  />
                            <Input label="Nama Pegawai" nama="nama" register={register} error={errors.nama?.message} />
                            <InputSelect label="Jenis Kelamin" nama="jenis_kelamin" register={register} error={errors.jenis_kelamin?.message} options={[{ value: "Laki-laki", label: "Laki-laki" }, { value: "Perempuan", label: "Perempuan" }]} />
                            
                            {/* Autocomplete Tempat Lahir */}
                            <div className="flex flex-col w-full">
                                <label className="mb-1 text-sm font-medium text-gray-700">
                                    Tempat Lahir
                                </label>
                                <Controller
                                    name="tempat_lahir"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Autocomplete
                                            options={kotaList}
                                            getOptionLabel={(option) => option.nama_kota || ""}
                                            value={kotaList.find((kota) => kota.nama_kota === value) || null}
                                            onChange={(_, newValue) => {
                                                onChange(newValue ? newValue.nama_kota : "");
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Ketik nama kota..."
                                                    error={!!errors.tempat_lahir}
                                                    helperText={errors.tempat_lahir?.message}
                                                    size="small"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '0.5rem', 
                                                            backgroundColor: 'white',
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#3b82f6', 
                                                                borderWidth: '1px', 
                                                            },
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </div>
                            <Input label="Tanggal Lahir" nama="tanggal_lahir" type="date" register={register} error={errors.tanggal_lahir?.message} />
                        </div>
                    </div>

                    {/* --- SEKSI 2: KONTAK & ALAMAT --- */}
                    <div data-tour="add-pegawai-kontak">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 md:mb-5">
                            Kontak & Alamat
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <Input label="Nomor HP" nama="no_hp" register={register} error={errors.no_hp?.message} />
                            <Input label="Email" nama="email" register={register} error={errors.email?.message} />
                            <TextArea label="Alamat Lengkap" nama="alamat" register={register} error={errors.alamat?.message} className="md:col-span-2" />
                        </div>
                    </div>

                    {/* --- SEKSI 3: DATA PEKERJAAN --- */}
                    {/* Padding dikurangi sedikit untuk layar HP (p-4) */}
                    <div data-tour="add-pegawai-pekerjaan" className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-100">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-5">
                            Data Pekerjaan & Perusahaan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <Input label="Tanggal Bergabung *" nama="tanggal_bergabung" type="date" register={register} error={errors.tanggal_bergabung?.message} />
                            <Input label="PIN Mesin Absensi *" nama="pin_mesin" register={register} error={errors.pin_mesin?.message} />
                            <InputSelect label="Departemen" nama="departemen" register={register} error={errors.departemen?.message} options={departemenList.map((dept: any) => ({ value: dept.id, label: dept.nama_departemen }))} />
                            <InputSelect label="Jabatan" nama="jabatan_id" register={register} error={errors.jabatan_id?.message} options={jabatanList.map(jabatan => ({ value: jabatan.id, label: jabatan.nama_jabatan }))} disabled={!selectedDept} />
                            <InputSelect label="Shift" nama="default_shift_id" register={register} error={errors.default_shift_id?.message} options={shiftList.map((shift: any) => ({ value: shift.id, label: shift.kode_shift || shift.nama_shift || `Shift ${shift.id}` }))} />
                        </div>
                    </div>

                    {/* --- TOMBOL SUBMIT --- */}
                    <div data-tour="add-pegawai-submit" className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                        <Button 
                            variant="success"
                            type="submit" 
                            label={addPegawaiMutation.isPending ? "Menyimpan..." : "Simpan"} 
                            disabled={addPegawaiMutation.isPending} 
                            icon={addPegawaiMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : undefined} 
                        />
                        <Button 
                            type="button" 
                            variant="danger" 
                            label="Batal" 
                            onClick={() => navigate(-1)} 
                            disabled={addPegawaiMutation.isPending} 
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
    )
}