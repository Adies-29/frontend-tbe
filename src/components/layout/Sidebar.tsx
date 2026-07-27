
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { CalendarDays, ChevronLeft, Clock, Coffee, DollarSign, LaptopMinimal, Layers, LogOut,  Menu,  Rows2,  Users, X, ListCheck, Wallet, Gift, Scissors } from "lucide-react";
import logoTbe from "../../assets/r3a.png";

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
    toggleSidebar?: () => void;
}


export default function Sidebar({ isOpen, closeSidebar, toggleSidebar }: SidebarProps) {
    const logout = useAuthStore((state) => state.logout);
    const role = useAuthStore((state) => state.role);
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const handleMenuClick = () => {

        if (window.innerWidth < 768) {
            closeSidebar();
        }
    };

    const navItems = [
        { title: "Monitoring", path: "/dashboard", isEnd: true, icon: LaptopMinimal },

        { title: "Data Pegawai", path: "/dashboard/data-pegawai", icon: Users },

        { title: "Data Departemen", path: "/dashboard/departemen", icon: Layers },
        { title: "Data Jabatan", path: "/dashboard/jabatan", icon: Rows2 },
        { title: "Jadwal & Shift", path: "/dashboard/jadwal-shift", icon: CalendarDays },
        { title: "Gaji & Tunjangan", path: "/dashboard/gaji-tunjangan", icon: DollarSign },
        { title: "Lembur", path: "/dashboard/lembur", icon: Coffee },
        { title: "Kasbon", path: "/dashboard/kasbon", icon: Wallet },
        { title: "Target", path: "/dashboard/target-packing", icon: ListCheck },
        { title: "Bonus Custom", path: "/dashboard/bonus-custom", icon: Gift },
        { title: "Potongan Custom", path: "/dashboard/potongan-custom", icon: Scissors },
        { title: "Waktu Mesin", path: "/dashboard/pengaturan-mesin", icon: Clock },
    ];

    return (
        <div className={`
            bg-[#C90003] flex flex-col justify-between py-6 px-4 shadow-xl z-50
            fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden
            ${isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:translate-x-0"}
        `}>

            {/* Bagian Atas */}
            <div>
                {/* 3. Header Sidebar dengan Tombol Toggle Desktop */}
                <div className={`mb-10 flex items-center ${isOpen ? "justify-between px-2" : "justify-center flex-col gap-4"}`}>

                    {/* Teks Logo T-Be (Disembunyikan saat tertutup) */}
                    <div className={`transition-all duration-300 ${isOpen ? "opacity-100 block" : "hidden"}`}>
                        <div className="flex justify-center items-center">
                            <img
                                src={logoTbe}
                                alt="T-Be Logo"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Tombol Close untuk Mobile */}
                    <button className="md:hidden text-white hover:bg-white/20 p-1 rounded" onClick={closeSidebar}>
                        <X size={28} />
                    </button>

                    {/* Tombol Toggle untuk Desktop */}
                    <button
                        className="hidden md:block text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                        onClick={toggleSidebar}
                        title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
                    >
                        {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                    </button>
                </div>


                <nav>
                    <ul className="flex flex-col gap-2 w-full font-medium">
                        {navItems.filter((item) => {
                            if (role?.toLowerCase() === "mandor") {
                                return item.title === "Monitoring" || item.title === "Target" || item.title === "Lembur";
                            }
                            return true;
                        }).map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <li key={index}>
                                    <NavLink
                                        to={item.path}
                                        end={item.isEnd}
                                        onClick={handleMenuClick}
                                        title={!isOpen ? item.title : ""}
                                        className={({ isActive }) =>
                                            `transition-colors flex items-center p-3 rounded-md group
                                            ${isActive
                                                ? "bg-white/20 text-yellow-300 font-bold border-l-4 border-yellow-300"
                                                : "text-white hover:bg-white/10 hover:text-amber-200"
                                            }
                                            ${!isOpen ? "justify-center" : "px-4"}`
                                        }>

                                        <Icon size={20} className="shrink-0" />

                                        <span className={`whitespace-nowrap transition-all duration-300 
                                            ${isOpen ? "opacity-100 w-auto ml-4" : "opacity-0 w-0 overflow-hidden ml-0"}`}>
                                            {item.title}
                                        </span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* Bagian Bawah */}
            <div className={`flex flex-col items-center mt-10 transition-all ${isOpen ? "gap-6" : "gap-4"}`}>

                {/* Tombol Logout */}
                <button
                    type="button"
                    onClick={handleLogout}
                    title={!isOpen ? "Logout" : ""}
                    className={`flex items-center p-2 text-white font-semibold cursor-pointer hover:text-yellow-300 transition-colors w-full
                        ${isOpen ? "justify-center gap-3 border-b border-white/30 pb-4" : "justify-center"}`}
                >
                    <LogOut size={24} strokeWidth={2.5} className="shrink-0" />

                    {/* Teks Logout (Disembunyikan saat tertutup) */}
                    <span className={`text-lg whitespace-nowrap transition-all duration-300 
                        ${isOpen ? "opacity-100 w-auto block" : "opacity-0 w-0 overflow-hidden hidden"}`}>
                        Logout
                    </span>
                </button>

                {/* Copyright (Disembunyikan saat tertutup) */}
                <div className={`w-full text-center transition-all duration-300 
                    ${isOpen ? "opacity-100 block" : "opacity-0 hidden"}`}>
                    <p className="text-[10px] md:text-[11px] font-light text-white/70 leading-tight">
                        &copy; {currentYear} T-Be (tiga berlian) by R3A Studio<br />All Rights Reserved
                    </p>
                    <p className="text-[10px] md:text-[11px] font-medium text-white/40 mt-1.5">
                        v{import.meta.env.PACKAGE_VERSION || "0.0.0"}
                    </p>
                </div>
            </div>

        </div>
    );
}