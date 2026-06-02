import { useNavigate, useParams } from "react-router-dom";
import z from "zod"
import { useAuthStore } from "../../../store/useAuthStore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import { TextArea } from "../../../components/ui/TextArea";
import { Input } from "../../../components/ui/InputText";
import { InputSelect } from "../../../components/ui/InputSelect";

const schema = z.object({
    nik: z.string()
            .regex(/^[0-9]*$/, "NIK hanya boleh berisi angka")
            .max(16, "NIK harus 16 digit")
            .optional(),
    no_bpjs: z.string()
            .regex(/^[0-9]*$/, "No BPJS hanya boleh berisi angka")
            .optional(),
    tanggal_bergabung: z.string().min(1, "Tanggal bergabung harus diisi"),
    jenis_kelamin: z.string().min(1, "Jenis Kelamin harus diisi"),
    nama: z.string().min(1, "Nama Pegawai harus diisi"),
    tempat_lahir: z.string().min(1, "Tempat Lahir harus diisi"),
    tgl_lahir: z.string().min(1, "Tanggal Lahir harus diisi"),
    no_hp: z.string()
            .regex(/^[0-9]*$/, "Nomor HP hanya boleh berisi angka")
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

export default function EditPegawai(){
    const { id } =useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => (state.token));

    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true)

    //master data
    const [departemenList, setDepartemenList] = useState<any[]>([]);
    const [jabatanList, setJabatanList] = useState<any[]>([]);
    const [shiftList, setShiftList] = useState<any[]>([]);
    const [allJabatan, setAllJabatan] = useState<any[]>([])

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
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
                    fetch("http://localhost:3000/api/v1/departemen", { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch("http://localhost:3000/api/v1/jabatan", { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch("http://localhost:3000/api/v1/shifts", { headers: { "Authorization": `Bearer ${token}` } })
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
                    

                const resPegawai = await fetch(`http://localhost:3000/api/v1/pegawai/${id}`, {
                    headers: { "Authorization" : `Bearer ${token}` }
                });
                const dataPegawai = await resPegawai.json();
                console.log("CEK DATA PEGAWAI DARI BACKEND:", dataPegawai.data);
                
                if(resPegawai.ok && dataPegawai.success){
                    
                    const pegawai = dataPegawai.data;
                    const currentJabatan = masterJabatan.find((j: any) => j.id === pegawai.jabatan_id);
                    const pegawaiId = currentJabatan ? currentJabatan.departemen_id?.toString() : "";

                    const pilihJabatan = masterJabatan.filter((j: any) => j.departemen_id?.toString() === pegawaiId );
                    setJabatanList(pilihJabatan);

                    const { nik, no_bpjs, tanggal_bergabung, jenis_kelamin, nama, tempat_lahir, tgl_lahir, no_hp, alamat, email, pin_mesin, jabatan_id, default_shift_id } = pegawai;

                    reset({
                        nik: nik || "",
                        no_bpjs: no_bpjs || "",
                        tanggal_bergabung: tanggal_bergabung || "",
                        jenis_kelamin: jenis_kelamin || "",
                        nama: nama || "",
                        tempat_lahir: tempat_lahir || "",
                        tgl_lahir: tgl_lahir || "",
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
            const response = await fetch(`http://localhost:3000/api/v1/pegawai/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization" : `Bearer ${token}`
                },
                 body: JSON.stringify({
                    nik: data.nik || null,
                    no_bpjs: data.no_bpjs || null,
                    tanggal_bergaung: data.tanggal_bergabung,
                    jenis_kelamin: data.jenis_kelamin,
                    nama: data.nama,
                    tempat_lahir: data.tempat_lahir,
                    tgl_lahir:data.tgl_lahir,
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
                <p>Memuat data karyawan...</p>
            </div>
        );
    }
    
    return(
        <div className="p-6 w-full mx-auto">
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
                            label="NIK Pegawai"
                            nama="nik"
                            register={register}
                            error={errors.nik?.message}
                        />

                        <Input
                            label="N0 BPJS Pegawai"
                            nama="no_bpjs"
                            register={register}
                            error={errors.no_bpjs?.message}
                        />

                        <InputSelect
                            label="Jenis Kelamin"
                            nama="jenis_kelamin"
                            register={register}
                            error={errors.jenis_kelamin?.message}
                            options={departemenList.map(dept => ({
                                value: dept.id,
                                label: dept.nama_departemen
                            }))}
                        />

                        <Input
                            label="Nama Karyawan"
                            nama="nama"
                            register={register}
                            error={errors.nama?.message}
                        />

                        <Input
                            label="Tempat Lahir"
                            nama="tempat_lahir"
                            register={register}
                            error={errors.tempat_lahir?.message}
                        />
                        <Input
                            label="Tanggal Lahir"
                            nama="tgl_lahir"
                            type="date"
                            register={register}
                            error={errors.tgl_lahir?.message}
                        />

                        <Input
                            label="Nomor HP"
                            nama="nohp"
                            register={register}
                            error={errors.no_hp?.message}
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
                            label="Alamat Lengkap"
                            nama="alamat"
                            register={register}
                            error={errors.alamat?.message}
                            className="md:col-span-2"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-5">
                        <Button type="submit" label="Simpan" disabled={isSaving} />
                        <Button
                            type="button"
                            variant="secondary"
                            label="Batal"
                            onClick={() => navigate(-1)}
                            disabled={isSaving}
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}