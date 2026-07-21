
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
import backgroundImage from "../../../assets/bg_login.png";
import tb from "../../../assets/tb.jpg";
import { useNotif } from "../../../hooks/useNotif";

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
    const { notif, showNotif, closeNotif } = useNotif();

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
                login(data.username, result.token, result.role || "admin");

                showNotif("Login berhasil", "success");
                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                // Tampilkan pesan error dari backend (misal: "Username salah")
                const errorMessage = result.message || (response.status === 401 ? "Username atau password salah." : getSafeErrorMessage(response.status));
                showNotif(errorMessage, "error");
            }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            showNotif("Terjadi kesalahan saat login. Silakan coba lagi.", "error");
        } finally {
            setIsLoading(false);
        }
    };


   return (
    <>
        {/* Background */}
        <div
            className="fixed inset-0 -z-20"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        />

        {/* Overlay */}
        <div className="fixed inset-0 bg-black/40 -z-10" />

        {/* Content */}
        <div className="h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="w-full max-w-2xl my-auto">
                <div className="rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl p-8 sm:p-11">

                    {/* Logo */}
                    <div className="flex justify-center">
                        <img
                            src={tb}
                            alt="Logo"
                            className="w-20 h-20 object-contain"
                        />
                    </div>

                    {/* Heading */}
                    <div className="mt-5 text-center">
                        <p className="text-xs sm:text-sm uppercase tracking-[4px] text-gray-500 font-semibold">
                            Attendance System
                        </p>
                        <h1 className="mt-2 text-3xl sm:text-[42px] font-bold text-gray-900 tracking-tight leading-tight">
                            Sistem Absensi
                        </h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-green-700 font-semibold">
                            TBE (Tiga Berlian)
                        </p>
                        <p className="mt-3 text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                            Silakan login menggunakan akun yang telah diberikan administrator.
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mt-7 space-y-5"
                    >
                        <Input
                            type="text"
                            placeholder="Masukkan username"
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

                        <Button
                            type="submit"
                            variant="success"
                            disabled={isLoading}
                            label={isLoading ? "Memproses..." : "Masuk"}
                            className="w-full h-13 rounded-xl text-base font-semibold transition-colors cursor-pointer"
                        />
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
                            Hanya dapat diakses oleh karyawan yang telah terdaftar.
                        </p>
                    </div>

                </div>
            </div>
        </div>

        <Notif
            show={notif.show}
            message={notif.message}
            type={notif.type}
            onClose={closeNotif}
        />
    </>
);
}