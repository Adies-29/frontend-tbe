import { useAuthStore } from "../store/useAuthStore";

/**
 * Wrapper untuk fetch API bawaan browser.
 * Secara otomatis mendeteksi error 401 (Unauthorized) 
 * dan melakukan auto-logout untuk mengamankan sesi.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    // Tangkap status 401 Token Kadaluarsa / Tidak Valid
    if (response.status === 401) {
        console.warn("Token terdeteksi kadaluarsa atau tidak valid. Melakukan auto-logout...");
        
        // Panggil fungsi logout dari Zustand Store (bisa dipanggil di luar React component)
        useAuthStore.getState().logout();
        
        // Paksa redirect ke halaman login untuk keamanan ekstra
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }

    return response;
}
