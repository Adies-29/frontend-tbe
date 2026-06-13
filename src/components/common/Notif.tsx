import { CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    show: boolean;
    message: string;
    type?: "success" | "error";
    onClose: () => void;
}

export default function Notif({ show, message, type = "success", onClose }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const isSuccess = type === "success";

    return (
        <div className={`fixed bottom-6 right-6 z-70 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[bounce_0.5s_ease-in-out] text-white
            ${isSuccess ? "bg-green-600" : "bg-[#C90003]"}`} 
        >
            {isSuccess ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <span className="font-medium text-sm md:text-base">{message}</span>
        </div>
    );
}