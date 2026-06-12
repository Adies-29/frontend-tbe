export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

if (!API_BASE_URL) {
    console.error('VITE_API_BASE_URL belum dikonfigurasi di file .env');
}
