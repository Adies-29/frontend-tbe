import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode; 
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
}

export default function ConfirmPopUp({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    variant = "danger"
}: ConfirmPopUpProps) {
    
    if (!isOpen) return null;

   
    const variantStyles = {
        danger: {
            iconBg: "bg-red-100 text-red-600",
            btnConfirm: "bg-[#C90003] hover:bg-red-800 text-white"
        },
        warning: {
            iconBg: "bg-yellow-100 text-yellow-600",
            btnConfirm: "bg-yellow-500 hover:bg-yellow-600 text-white"
        },
        primary: {
            iconBg: "bg-blue-100 text-blue-600",
            btnConfirm: "bg-blue-600 hover:bg-blue-700 text-white"
        },
        success: {
            iconBg: "bg-emerald-100 text-emerald-600",
            btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white"
        }
    };

    const style = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center transform transition-all duration-300 scale-100">
                
                <div className={`${style.iconBg} p-3 rounded-full mb-4`}>
                    <AlertTriangle size={36} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                
                <div className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {message}
                </div>
                
                <div className="flex w-full gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-sm ${style.btnConfirm}`}
                    >
                        {confirmText}
                    </button>
                </div>
                
            </div>
        </div>
    );
}