import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Button from "../../../components/common/Button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../components/common/InputText";
import Notif from "../../../components/common/Notif";
import { apiFetchJson } from "../../../utils/apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotif } from '../../../hooks/useNotif';


const schema = z.object({
    nama: z.string().min(1, "Nama Departemen harus diisi"),
});

type FormData = z.infer<typeof schema>;

export default function AddDepartemen() {
    const navigate = useNavigate();
    const { notif, showNotif, showErrorNotif, closeNotif } = useNotif();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const addDeptMutation = useMutation({
        mutationFn: (data: FormData) =>
            apiFetchJson('/api/v1/departemen', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nama_departemen: data.nama
                })
            }),
        onSuccess: (result) => {
            const namaDept = result.data?.nama_departemen || "";
            showNotif(`Data departemen ${namaDept} berhasil disimpan!`.trim(), "success");
            queryClient.invalidateQueries({ queryKey: ["departemen"] });
            setTimeout(() => {
                navigate("/dashboard/departemen");
            }, 1500);
        },
        onError: (error) => {
            showErrorNotif(error);
        }
    });

    const onSubmit = async (data: FormData) => {
      addDeptMutation.mutate(data);
    };

    return (
        <div data-tour="add-dept-form" className="p-6 max-w-2xlmx-auto w-full">
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
                            label={addDeptMutation.isPending ? "Menyimpan.." : "Simpan"}
                            disabled={addDeptMutation.isPending}
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
                onClose={closeNotif}
            />
        </div>
    );
}