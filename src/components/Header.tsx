import { useEffect, useState } from "react";
import { useLocation, matchPath } from "react-router-dom"; 

import { useAuthStore } from "../store/useAuthStore";
import { apiFetch } from "../utils/apiFetch";
import DateTime from "./common/DateTime";

export default function Header() {
    // --- LOGIKA SHIFT ---
    const [_currentShift, setCurrentShift] = useState("");
    const [_isLoading, setIsLoading] = useState(true);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const fetchShiftData = async () => {
            try {
                setIsLoading(true);
                const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json"
                    }
                });
                if (!response.ok) throw new Error("Backend tidak merespons");
                
                const data = await response.json();
                setCurrentShift(data.shift);
            } catch (error) {
                console.error("Gagal mengambil data shift:", error);
                setCurrentShift("Shift 1"); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchShiftData();
    }, []);

    // --- LOGIKA NAVIGASI DINAMIS ---
    const location = useLocation();
    
    // 2. Buat Kamus Rute
    const routeConfig: Record<string, { title: string; showDate: boolean }> = {
        "/": { title: "Monitoring Absensi", showDate: true },
        "/dashboard": { title: "Monitoring Absensi", showDate: true },

        "/dashboard/data-pegawai": { title: "Data Pegawai", showDate: false },
        "/dashboard/data-pegawai/tambah-pegawai": { title: "Tambah Pegawai", showDate: false },
        "/dashboard/data-pegawai/:id": { title: "Detail Pegawai", showDate: false },

        "/dashboard/departemen": { title: "Departemen", showDate: false },
        "/dashboard/departemen/tambah-departemen": { title: "Departemen", showDate: false },
        "/dashboard/departemen/:id": { title: "Departemen", showDate: false },


        "/dashboard/jabatan": { title: "Jabatan", showDate: false },
        "/dashboard/jabatan/tambah-jabatan": { title: "Jabatan", showDate: false },


        "/dashboard/jadwal-shift": { title: "Jadwal & Shift", showDate: false },
        "/dashboard/jadwal-shift/tambah": { title: "Jadwal & Shift", showDate: false },
        "/dashboard/jadwal-shift/edit/:id": { title: "Jadwal & Shift", showDate: false },
        


        "/dashboard/gaji-tunjangan":{ title: "Gaji & Tunjangan", showDate: false },
        "/dashboard/gaji-tunjangan/master-gaji/:id":{ title: "Gaji & Tunjangan", showDate: false },


        "/dashboard/lembur":{ title: "Lembur", showDate: false },
        "/dashboard/lembur/tambah-lembur":{ title: "Lembur", showDate: false },
        "/dashboard/lembur/edit/:id":{ title: "Lembur", showDate: false },

        "/dashboard/kasbon":{ title: "Kasbon", showDate: false },
        "/dashboard/kasbon/tambah":{ title: "Kasbon", showDate: false },
        

        "/dashboard/target-packing":{ title: "Target", showDate: false },

        "/dashboard/bonus-custom":{ title: "Bonus", showDate: false },
    };

    // 3. DIUBAH: Cari pengaturan berdasarkan URL menggunakan matchPath
    let currentRoute = { title: "Dashboard", showDate: false }; 

    for (const pattern in routeConfig) {
        if (matchPath({ path: pattern, end: true }, location.pathname)) {
            currentRoute = routeConfig[pattern];
            break; 
        }
    }

    return (
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 drop-shadow-sm w-full gap-4">
            
            {/* KIRI */}
            <div className="flex flex-row items-center justify-between w-full md:w-auto">
                <div className="my-2 md:my-4">
                    {/* 4. Cetak Judul Dinamis */}
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-none">
                        {currentRoute.title}
                    </h1>
                </div>

               <div className="md:hidden bg-[#C90000] rounded-full flex items-center gap-2 px-3 py-1.5 my-2 shadow-md cursor-pointer">
                    <div className="bg-[#FFB800] w-7 h-7 rounded-full border-2 border-white/20"></div>
                    
                    <span className="text-white font-medium text-base md:text-xs tracking-wide text-center">
                        {user || "Admin"}
                    </span>
                </div>
            </div>


            {/* 5. Tampilkan DateTime HANYA jika showDate bernilai true */}
            {currentRoute.showDate && (
                <div className="w-full md:w-auto flex justify-center">
                    <DateTime />
                </div>
            )}

            {/* KANAN */}
           <div className="hidden md:flex bg-[#C90003] rounded-full items-center gap-3 pr-6 pl-1 py-1 shadow-md cursor-pointer hover:bg-red-800 transition-colors">
                <div className="bg-[#FFB800] w-10 h-10 rounded-full border-2 border-white/20"></div>
                <span className="text-white font-medium text-base md:text-lg tracking-wide text-center">
                    {user || "Admin"}
                </span>
            </div>

        </header>
    );
}