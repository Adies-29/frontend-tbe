

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    variant?: "primary" | "success" | "secondary" | "danger" | "warning" | "info" | "back";
    isLoading?: boolean;
    className? : string;
    icon? : React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    label,
    variant = "primary",
    type = "button",
    onClick,
    isLoading = false,
    className = "",
    icon,
    disabled,
    ...rest
}) => {

    const baseStyle = "inline-flex items-center justify-center gap-2 font-semibold text-[15px] md:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95";
    const varianStyle = {
        primary: "bg-[#FFb702] hover:bg-yellow-500 text-white focus:ring-yellow-400 rounded-lg px-5 py-2.5 shadow-sm",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-600 rounded-lg px-5 py-2.5 shadow-sm",

        // Secondary: Batal / Aksi netral (Putih dengan garis pinggir abu-abu lembut)
        secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-200 rounded-lg px-5 py-2.5 shadow-sm",

        // Danger: Hapus / Peringatan keras (Menggunakan warna merah khas header-mu)
        danger: "bg-[#C90003] hover:bg-red-800 text-white focus:ring-[#C90003] rounded-lg px-5 py-2.5 shadow-sm",

        // Warning: Edit / Modifikasi (Oranye)
        warning: "bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500 rounded-lg px-5 py-2.5 shadow-sm",

        // Info: Aksi sekunder/informasi (Biru)
        info: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 rounded-lg px-5 py-2.5 shadow-sm",

        // Back: Tombol panah kembali (Berbentuk bulat, tanpa background bawaan)
        back: "p-2 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full focus:ring-gray-300"
    };
    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            onClick={onClick}
            className={`${baseStyle} ${varianStyle[variant]} ${className}`}
            title={label} // Menampilkan teks tooltip saat mouse hover (berguna untuk tombol back)
            {...rest}
        >
            {isLoading ? "Loading..." : (
                <>
                    {/* Jika ada icon, tampilkan di sini. Beri margin kanan (mr-2) jika ada teksnya */}
                    {icon && <span className={label ? "mr-2" : ""}>{icon}</span>}
                    {label}
                </>
            )}
        </button>
    );
};

export default Button;