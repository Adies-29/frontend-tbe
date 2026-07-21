import { useState } from "react";
import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';
import { Eye, EyeOff } from "lucide-react";

interface InputPasswordProps<T extends FieldValues = any> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
    label: string;
    nama: Path<T>;
    error?: string;
    register: UseFormRegister<T>;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    helperText?: React.ReactNode;
    className?: string;
}

export const InputPassword = <T extends FieldValues = any>({
    label,
    nama,
    error,
    register,
    placeholder = "Masukkan password",
    disabled = false,
    readOnly = false,
    helperText,
    className = "",
    ...rest
}: InputPasswordProps<T>) => {
    const [show, setShow] = useState<boolean>(false);
    const registerProps = register(nama);

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={nama || label} className="text-xs font-bold text-slate-700">
                {label}
            </label>

            <div className="relative w-full">
                <input
                    id={nama || label}
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    {...registerProps}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={`w-full border border-slate-300 rounded-xl pl-3 pr-10 py-3 text-xs font-medium text-slate-800 outline-none transition-all 
                    ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'focus:border-black focus:ring-2 focus:ring-black/20'}
                    ${disabled || readOnly ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'} ${className}`}
                    {...rest}
                />

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            {helperText && !error && <div className="mt-1 text-xs text-slate-500">{helperText}</div>}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default InputPassword;