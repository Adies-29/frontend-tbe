import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface InputTextProps<T extends FieldValues = any> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
    label: string;
    nama?: Path<T>;
    type?: string;
    error?: string;
    register?: UseFormRegister<T>;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    helperText?: React.ReactNode;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = <T extends FieldValues = any>({
    label,
    nama,
    type = "text",
    error,
    register,
    placeholder,
    disabled = false,
    readOnly = false,
    helperText,
    value,
    onChange,
    className = "",
    ...rest
}: InputTextProps<T>) => {
    const registerProps = register && nama ? register(nama) : {};

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={nama || label} className="text-xs font-bold text-slate-700">
                {label}
            </label>
            <input
                id={nama || label}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...registerProps}
                disabled={disabled}
                readOnly={readOnly}
                className={`w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none transition-all 
                ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'focus:border-red-500 focus:ring-2 focus:ring-red-500/20'}
                ${disabled || readOnly ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'} ${className}`}
                {...rest}
            />
            {helperText && !error && <div className="mt-1 text-xs text-slate-500">{helperText}</div>}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default Input;