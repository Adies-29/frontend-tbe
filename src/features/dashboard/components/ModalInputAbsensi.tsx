import { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { apiFetchJson } from "../../../utils/apiFetch";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";
import { Input } from "../../../components/common/InputText";
import { useNotif } from "../../../hooks/useNotif";

const absenManualSchema = z.object({
    pegawai_id: z.string().min(1, "Pegawai wajib dipilih"),
    jam_masuk: z.string().optional(),
    jam_pulang: z.string().optional(),
});

type FormData = z.infer<typeof absenManualSchema>;

interface ModalInputAbsensiProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalInputAbsensi({ isOpen, onClose, onSuccess }: ModalInputAbsensiProps) {
    const [pegawaiList, setPegawaiList] = useState<{ id: string; nama?: string; nama_lengkap?: string; pin_mesin?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors }
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(absenManualSchema) as any,
        defaultValues: {
            pegawai_id: "",
            jam_masuk: "",
            jam_pulang: ""
        }
    });

    // Ambil data pegawai saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            const fetchPegawai = async () => {
                try {
                    const result = await apiFetchJson('/api/v1/pegawai');
                    setPegawaiList(result.data || []);
                } catch (error) {
                    console.error("Gagal mengambil data pegawai:", error);
                }
            };
            fetchPegawai();
        } else {
            // Reset form jika ditutup
            reset({
                pegawai_id: "",
                jam_masuk: "",
                jam_pulang: ""
            });
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            // Cari data pegawai yang dipilih untuk mengambil pin_mesin
            const selectedPegawai = pegawaiList.find(p => p.id.toString() === data.pegawai_id);

            const payload = {
                ...data,
                pin_mesin: selectedPegawai?.pin_mesin || ""
            };

            const result = await apiFetchJson('/api/v1/absen/manual', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            showNotif(`Absensi manual ${result.data?.nama_pegawai || 'pegawai'} berhasil disimpan`, "success");

            setTimeout(() => {
                onClose();
                onSuccess();
            }, 1500);

        } catch (error) {
            console.error("Error Absen Manual:", error);
            showErrorNotif(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-600" size={20} />
                        <h3 className="font-bold text-gray-800 text-lg">Input Absensi Manual</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                        <div className="flex flex-col w-full gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Nama Pegawai <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                name="pegawai_id"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        options={pegawaiList}
                                        getOptionLabel={(option) => option.nama_lengkap || option.nama || "Tanpa Nama"}
                                        value={pegawaiList.find((p) => p.id.toString() === value) || null}
                                        onChange={(_, newValue) => {
                                            onChange(newValue ? newValue.id.toString() : "");
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Ketik nama pegawai untuk mencari..."
                                                error={!!errors.pegawai_id}
                                                helperText={errors.pegawai_id?.message}
                                                size="small"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '0.5rem',
                                                        backgroundColor: '#f9fafb',
                                                        '&.Mui-focused': {
                                                            backgroundColor: 'white',
                                                        },
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


                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Jam Masuk (Opsional)"
                                nama="jam_masuk"
                                type="time"
                                register={register}
                                error={errors.jam_masuk?.message}
                            />

                            <Input
                                label="Jam Pulang (Opsional)"
                                nama="jam_pulang"
                                type="time"
                                register={register}
                                error={errors.jam_pulang?.message}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="danger"
                                className="flex-1"
                                label="Batal"
                                onClick={onClose}
                            />
                            <Button
                                type="submit"
                                label={isLoading ? "Menyimpan..." : "Simpan Absen"}
                                variant="success"
                                disabled={isLoading}
                                className="flex-1"
                            />
                        </div>
                    </form>
                </div>

                <Notif
                    show={notif.show}
                    message={notif.message}
                    type={notif.type}
                    onClose={closeNotif}
                />
            </div>
        </div>
    );
}
