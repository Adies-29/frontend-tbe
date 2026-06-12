
import { useState } from "react";
import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';


interface InputPasswordProps<T extends FieldValues> {
    label:string;
    nama:Path<T>;
    error?:string;
    register:UseFormRegister<T>;
}

export const InputPassword = <T extends FieldValues>  ({
    label,
    nama,
    error,
    register,
}: InputPasswordProps<T>) => {

    const [show, setShow] = useState<boolean>(false);

    return (
        <div className="flex flex-col gap-1 mb-4">
            <label htmlFor={label}>{label}</label>

            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    {...register(nama)} className="border p-2 w-full px-3 py-2 pr-10"
                    placeholder={label}
                />

                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 text-sm">
                    {show ? "Hide" : "show"}
                </button>
            </div>

            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
};