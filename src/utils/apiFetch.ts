import { useAuthStore } from "../store/useAuthStore";
import { getSafeErrorMessage } from "./errorHandler";

/**
 * Helper untuk menyambung Base URL secara otomatis jika path diawali dengan '/'.
 */
function resolveUrl(input: RequestInfo | URL): RequestInfo | URL {
    if (typeof input === "string" && input.startsWith("/")) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        return `${baseUrl}${input}`;
    }
    return input;
}

/**
 * Helper untuk menyuntikkan header Authorization Bearer token secara otomatis jika belum ada.
 */
function resolveHeaders(init?: RequestInit): HeadersInit {
    const headers = new Headers(init?.headers || {});

    // Auto-inject Authorization header jika token ada dan belum dipasang manual
    const token = useAuthStore.getState().token;
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
}

/**
 * Wrapper untuk fetch API bawaan browser.
 * - Auto-resolve Base URL jika input diawali '/' (misal: '/api/v1/pegawai')
 * - Auto-inject Authorization Bearer token dari Zustand store
 * - Secara otomatis mendeteksi error 401 (Unauthorized) dan melakukan auto-logout
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const targetUrl = resolveUrl(input);
    const updatedHeaders = resolveHeaders(init);

    const updatedInit: RequestInit = {
        ...init,
        headers: updatedHeaders,
    };

    const response = await fetch(targetUrl, updatedInit);

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

/**
 * Helper terstandarisasi untuk fetch JSON.
 * - Membaca response JSON secara aman (safe parse jika body kosong/non-JSON)
 * - Mengecek HTTP error status (!response.ok) DAN payload status (success === false)
 * - Melempar Error dengan urutan prioritas:
 *   1. json.message / json.error (Pesan spesifik dari backend)
 *   2. getSafeErrorMessage(response.status) (Pesan ramah pengguna berdasarkan HTTP status code)
 */
export async function apiFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await apiFetch(input, init);
    const json = await response.json().catch(() => ({}));

    if (!response.ok || json.success === false) {
        const errorMessage = json.message || json.error || getSafeErrorMessage(response.status);
        throw new Error(errorMessage);
    }

    return json as T;
}
