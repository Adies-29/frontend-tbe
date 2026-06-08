
import { persist, createJSONStorage  } from "zustand/middleware";
import { create  } from "zustand";
import { jwtDecode } from "jwt-decode";

interface AuthState{
    isAuthenticated : boolean;
    user : string | null
    token: string | null;
    login: (user: string, token: string) => void;
    logout : () => void;
    isTokenValid: () => boolean;
}

    

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
            }),
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                // Bersihkan storage secara eksplisit
                sessionStorage.removeItem("auth-storage");
            },
            // Validasi apakah token masih berlaku
            isTokenValid: () => {
                const token = get().token;
                if (!token) return false;
                try {
                    const decoded = jwtDecode<{ exp: number }>(token);
                    // Cek apakah token sudah expired (bandingkan dengan waktu sekarang)
                    return decoded.exp * 1000 > Date.now();
                } catch {
                    return false;
                }
            },
        }),
        {
          name: "auth-storage", // Ini akan menjadi nama kunci (key) di dalam localStorage browser
          storage: createJSONStorage(() => sessionStorage),
        }
      )
);
