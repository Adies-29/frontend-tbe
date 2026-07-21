import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import type { SelectOption } from './InputSelect';

interface InputSearchableSelectProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}

export const InputSearchableSelect = ({
    label,
    value,
    onChange,
    error,
    disabled = false,
    options,
    placeholder = "-- Pilih --",
    className = ""
}: InputSearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Filtered options based on search query
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div className={`flex flex-col gap-1.5 relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-sm font-semibold text-gray-700">
                    {label}
                </label>
            )}

            {/* Trigger Box */}
            <div
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg flex items-center justify-between cursor-pointer transition-all select-none ${
                    disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : "hover:bg-white"
                } ${
                    error ? "border-red-500 ring-1 ring-red-500" : isOpen ? "border-blue-500 ring-1 ring-blue-500 bg-white" : "border-gray-300"
                }`}
            >
                <span className={`text-sm truncate ${selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-blue-500" : ""}`} />
            </div>

            {/* Dropdown Options Box */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
                        <Search size={16} className="text-gray-400 shrink-0 ml-1" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={`Cari ${label.toLowerCase()}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none py-1"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-gray-400 italic">
                                Tidak ada data yang sesuai "{searchQuery}"
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`px-3 py-2.5 text-sm rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-blue-50 text-blue-600 font-semibold"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check size={16} className="text-blue-600 shrink-0" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <span className="text-xs font-medium text-red-500 mt-0.5">
                    {error}
                </span>
            )}
        </div>
    );
};

export default InputSearchableSelect;
