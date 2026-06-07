import { useNavigate, useParams } from "react-router-dom";
import z from "zod"
import { useAuthStore } from "../../../store/useAuthStore";
import { useEffect, useState } from "react";

import { useForm, Controller } from 'react-hook-form'; 
import Autocomplete from '@mui/material/Autocomplete'; 
import TextField from '@mui/material/TextField'; 

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import { TextArea } from "../../../components/ui/TextArea";
import { Input } from "../../../components/ui/InputText";
import { InputSelect } from "../../../components/ui/InputSelect";

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
    tempat_lahir: z.string().min(1, "Tempat Lahir harus diisi"),
    tanggal_lahir: z.string().min(1, "Tanggal Lahir harus diisi"),
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


type FormData = z.infer<typeof schema>

const MOCK_KOTA = [
    { id: 1, nama_kota: "Jakarta" },
    { id: 2, nama_kota: "Surabaya" },
    { id: 3, nama_kota: "Bandung" },
    { id: 4, nama_kota: "Medan" },
    { id: 5, nama_kota: "Semarang" },
    { id: 6, nama_kota: "Yogyakarta" },
    { id: 7, nama_kota: "Malang" },
    { id: 8, nama_kota: "Makassar" },
];

export default function EditPegawai(){
    const { id } =useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => (state.token));

    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true)

    //master data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departemenList, setDepartemenList] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jabatanList, setJabatanList] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shiftList, setShiftList] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allJabatan, setAllJabatan] = useState<any[]>([])
    const [kotaList, _setKotaList] = useState<any[]>(MOCK_KOTA); 

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsFetchingData(true);

                const[resDept, resJabatan, resShift] = await Promise.all([
                    fetch("https://ppm-sooty.vercel.app/api/v1/departemen", { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }),
                    fetch("https://ppm-sooty.vercel.app/api/v1/jabatan", { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }),
                    fetch("https://ppm-sooty.vercel.app/api/v1/shifts", { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } })
                ]);
                const dataDept = await resDept.json();
                const dataJabatan = await resJabatan.json();
                const dataShift = await resShift.json();

                if (resDept.ok && dataDept.success) setDepartemenList(dataDept.data);
                let masterJabatan = [];
                if (resJabatan.ok && dataJabatan.success) {
                    masterJabatan = dataJabatan.data;
                    setAllJabatan(masterJabatan);
                }

                if(resShift.ok && dataShift.success) setShiftList(dataShift.data)
                    

                const resPegawai = await fetch(`https://ppm-sooty.vercel.app/api/v1/pegawai/${id}`, {
                    headers: { "Authorization" : `Bearer ${token}` }
                });
                const dataPegawai = await resPegawai.json();
                console.log("CEK DATA PEGAWAI DARI BACKEND:", dataPegawai.data);
                
                if(resPegawai.ok && dataPegawai.success){
                    
                    const pegawai = dataPegawai.data;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const currentJabatan = masterJabatan.find((j: any) => j.id === pegawai.jabatan_id);
                    const pegawaiId = currentJabatan ? currentJabatan.departemen_id?.toString() : "";

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pilihJabatan = masterJabatan.filter((j: any) => j.departemen_id?.toString() === pegawaiId );
                    setJabatanList(pilihJabatan);

                    const { nik, bpjs, tanggal_bergabung, jenis_kelamin, nama, tempat_lahir, tanggal_lahir, no_hp, alamat, email, pin_mesin, jabatan_id, default_shift_id } = pegawai;

                    reset({
                        nik: nik || "",
                        bpjs: bpjs || "",
                        tanggal_bergabung: tanggal_bergabung || "",
                        jenis_kelamin: jenis_kelamin || "",
                        nama: nama || "",
                        tempat_lahir: tempat_lahir || "",
                        tanggal_lahir: tanggal_lahir || "",
                        no_hp: no_hp || "",
                        alamat: alamat || "",
                        email: email || "",
                        pin_mesin: pin_mesin || "",
                        departemen: pegawaiId,
                        jabatan_id: jabatan_id?.toString() || "",
                        default_shift_id: default_shift_id?.toString() || "",
                    });
                };
                
            } catch (error) {
                console.error("Gagal memuat data:", error);
                alert("Terjadi kesalahan saat memuat data dari server.");
            } finally{
                setIsFetchingData(false);
            }
        };
        if (id) loadInitialData();
    }, [id, token, reset]);

    //  DROPDOWN Pilih Dept -> Filter Jabatan
    const selectedDept = watch("departemen");
   useEffect(() => {
        // Syarat !isFetchingData ini SUPER PENTING!
        // Artinya: "Jalankan reset jabatan HANYA JIKA proses loading data awal sudah selesai."
        if (!isFetchingData && selectedDept && allJabatan.length > 0) {
            
            // 1. Filter daftar jabatan sesuai departemen yang baru dipilih
            const filteredJabatan = allJabatan.filter((j) => j.departemen_id?.toString() === selectedDept.toString());
            
            // 2. Perbarui pilihan di dalam dropdown Jabatan
            setJabatanList(filteredJabatan);
            
            // 3. Kosongkan kotak jabatan yang lama agar HRD wajib memilih yang baru
            setValue("jabatan_id", ""); 
        }
    }, [selectedDept, allJabatan, isFetchingData, setValue]);

    // 3.SIMPAN PERUBAHAN
    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`https://ppm-sooty.vercel.app/api/v1/pegawai/${id}`, {
                method: "PUT",
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
                    tempat_lahir: data.tempat_lahir,
                    tanggal_lahir:data.tanggal_lahir,
                    no_hp: data.no_hp,
                    alamat: data.alamat,
                    email: data.email || null,
                    pin_mesin: data.pin_mesin || null,
                    jabatan_id: parseInt(data.jabatan_id),
                    default_shift_id: parseInt(data.default_shift_id),
                }),
            });

            const result = await response.json();

            
            if(response.ok && result.success){
                alert("Data karyawan berhasil diperbarui!");
                navigate("/dashboard/data-pegawai");
            }else{
                alert(result.message || "Gagal memperbarui data karyawan.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
        }finally{
            setIsSaving(false);
        }
    }

    if(isFetchingData) {
        return(
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Memuat data Pegawai...</p>
            </div>
        );
    }
    
    return(
        <div className="p-3 md:p-6 w-full">
            <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-100">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        Edit Pegawai
                    </h2>
                    <Button
                        variant="back"
                        icon={<ArrowLeft size={24} />}
                        onClick={() => navigate(-1)}
                        label="Kembali"
                    />
                </div>

                <form onSubmit={handleSubmit(onSubmit, (err) => console.log("ZOD ERROR:", err))} className="space-y-8">
                    
                    {/* --- SEKSI 1: INFORMASI PRIBADI --- */}
                    <div>
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
                    <div>
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
                    <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-100">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-5">
                            Data Pekerjaan & Perusahaan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <Input label="Tanggal Bergabung *" nama="tanggal_bergabung" type="date" register={register} error={errors.tanggal_bergabung?.message} />
                            <Input label="PIN Mesin Absensi *" nama="pin_mesin" register={register} error={errors.pin_mesin?.message} />
                            <InputSelect label="Departemen" nama="departemen" register={register} error={errors.departemen?.message} options={departemenList.map(dept => ({ value: dept.id, label: dept.nama_departemen }))} />
                            <InputSelect label="Jabatan" nama="jabatan_id" register={register} error={errors.jabatan_id?.message} options={jabatanList.map(jabatan => ({ value: jabatan.id, label: jabatan.nama_jabatan }))} disabled={!selectedDept} />
                            <InputSelect label="Shift" nama="default_shift_id" register={register} error={errors.default_shift_id?.message} options={shiftList.map(shift => ({ value: shift.id, label: shift.kode_shift || shift.nama_shift || `Shift ${shift.id}` }))} />
                        </div>
                    </div>

                    {/* --- TOMBOL SUBMIT --- */}
                    {/* Trik Khusus Mobile: flex-col-reverse membuat tombol numpuk atas-bawah di HP */}
                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                         <Button
                            variant="success" 
                            type="submit" 
                            label={isSaving ? "Menyimpan..." : "Simpan"} 
                            disabled={isSaving} 
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
        </div>
    )
}