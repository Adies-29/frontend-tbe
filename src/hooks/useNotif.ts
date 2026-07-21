// src/hooks/useNotif.ts
import { useState, useCallback } from 'react';
import { getSafeErrorMessage } from '../utils/errorHandler';

export function useNotif() {
    const [notif, setNotif] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error";
    }>({
        show: false,
        message: "",
        type: "success"
    });

    // Notifikasi umum (Sukses / Error)
    const showNotif = useCallback((message: string, type: "success" | "error" = "success") => {
        setNotif({ show: true, message, type });
    }, []);

    // Helper KHUSUS Error: Otomatis memproses HTTP status code atau objek Error
    const showErrorNotif = useCallback((error?: any, status?: number) => {
        let message = getSafeErrorMessage(status);

        if (typeof error === 'string' && error.trim()) {
            message = error;
        } else if (error?.message) {
            message = error.message;
        }

        setNotif({ show: true, message, type: "error" });
    }, []);

    const closeNotif = useCallback(() => {
        setNotif(prev => ({ ...prev, show: false }));
    }, []);

    return { notif, showNotif, showErrorNotif, closeNotif };
}
