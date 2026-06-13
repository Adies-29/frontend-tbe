
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiFetch } from "../../../utils/apiFetch";
import { getSafeErrorMessage } from "../../../utils/errorHandler";
import { Input } from "../../../components/common/InputText";
import { InputPassword } from "../../../components/common/InputPassword";
import Button from "../../../components/common/Button";
import Notif from "../../../components/common/Notif";



// 1. Ubah email menjadi username agar sesuai dengan backend
type FormData = {
    username: string;
    password: string;
}

// 2. Sesuaikan validasi Zod
const schema = z.object({
    username: z.string().min(1, "Username harus diisi"),
    password: z.string().min(6, "Password minimal 6 karakter"),
})

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false); // State untuk loading button
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


    // 3. Fungsi Submit ke Backend Vercel
    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            // Tembak API Login yang ada di backend
            const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    password: data.password
                }),
            });

            const result = await response.json();

            // Jika status 200 OK dan dari backend mengirim success: true
            if (response.ok && result.success) {
                // Simpan token JWT ke Zustand (dan LocalStorage)
                login(data.username, result.token);

                setNotif({ show: true, message: "Login berhasil", type: "success" });
                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                // Tampilkan pesan error dari backend (misal: "Username salah")
                setNotif({ show: true, message: getSafeErrorMessage(response.status), type: "error" });
            }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setNotif({ show: true, message: "Terjadi kesalahan saat login. Silakan coba lagi.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="mb-6 text-center">
                    <p className="text-sm text-gray-500 mt-1">Silakan login ke akun Anda</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* 4. Ubah input UI menjadi username */}
                    <Input
                        label="Username"
                        nama="username"
                        register={register}
                        error={errors.username?.message}
                    />

                    <InputPassword
                        label="Password"
                        nama="password"
                        register={register}
                        error={errors.password?.message}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            label={isLoading ? "Memproses..." : "Login"}
                            disabled={isLoading}
                            className="w-full py-3 text-lg"
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
};

