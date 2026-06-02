import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
// 1. Import useAuthStore untuk mengambil token
import { useAuthStore } from "../../store/useAuthStore"; 

interface ShiftData {
    kode_shift: string; // 2. Ubah dari kode_shift menjadi kode_shift agar sesuai dengan database
    jam_masuk: string;
    jam_pulang: string;
    lintas_hari?: boolean; 
}

export default function DateTime() {
    const [time, setTime] = useState(new Date());
    const [shiftList, setShiftList] = useState<ShiftData[]>([]);
    const [activeShift, setActiveShift] = useState("Memuat...");
    const [isLoading, setIsLoading] = useState(true);

    // 3. Ambil token JWT dari store
    const token = useAuthStore((state) => state.token);

    const checkCurrentShift = (currentTime: Date, shifts: ShiftData[]) => {
        if (!shifts || shifts.length === 0) return "Error/Kosong";

        const currentHours = currentTime.getHours().toString().padStart(2, '0');
        const currentMinutes = currentTime.getMinutes().toString().padStart(2, '0');
        const timeString = `${currentHours}:${currentMinutes}`;
        
        let kosong = "--"; // diluar jam kerja

        for (const shift of shifts) {
            const masuk = shift.jam_masuk.substring(0, 5);
            const pulang = shift.jam_pulang.substring(0, 5);

            if (shift.lintas_hari) {
                if (timeString >= masuk || timeString < pulang) {
                    kosong = shift.kode_shift; // Sesuaikan dengan interface baru
                    break;
                }
            } else {
                if (timeString >= masuk && timeString < pulang) {
                    kosong = shift.kode_shift; // Sesuaikan dengan interface baru
                    break;
                }
            }
        }
        return kosong;
    };

    // Fetch data dari backend
    useEffect(() => {
        const fetchShift = async () => {
            try {
                setIsLoading(true);
                
                // 4. Tambahkan Headers Authorization Bearer
                const response = await fetch("https://ppm-sooty.vercel.app/api/v1/shifts", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`, // <-- Kunci masuknya di sini
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Gagal ambil data. Pastikan token valid.");
                }

                const result = await response.json();
                const dataShift = Array.isArray(result) ? result : result.data;

                setShiftList(dataShift);
                setActiveShift(checkCurrentShift(new Date(), dataShift));
                
            } catch (error) {
                console.error(error);
                setActiveShift("Error");
            } finally {
                setIsLoading(false);
            }
        };

        // Hanya jalankan fetch jika token sudah tersedia (sudah login)
        if (token) {
            fetchShift();
        } else {
            setActiveShift("Belum Login");
            setIsLoading(false);
        }
    }, [token]); // Tambahkan token sebagai dependency useEffect

    // Update Shift otomatis
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);

            // Cek shift menggunakan data yang sudah di-fetch
            if (shiftList.length > 0) {
                setActiveShift(checkCurrentShift(now, shiftList));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [shiftList]);

    const formattedDate = time.toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
    });

    const formattedDay = time.toLocaleDateString("id-ID", { weekday: "long" });
    const formattedTime = time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).replace(".", " : ");

    return(
        <div className="flex items-center justify-center gap-4 md:gap-10 border border-gray-300 rounded-2xl px-4 md:px-6 py-2 bg-white w-full md:w-auto">

            {/* Bagian tanggal */}
            <div className="flex items-center gap-2">
                <Calendar size={30} className="text-black"/>
                <div className="flex flex-col">
                    <span className="text-lg md:text-xs text-gray-400 font-medium ">Tanggal</span>
                    <span className="text-base md:text-xl font-bold py-0.5">{formattedDate}</span>
                    <span className="text-lg md:text-lg font-semibold">{formattedDay}</span>
                </div>
            </div>

            {/* Bagian jam */}
            <div className="flex items-center gap-2">
                <Clock size={30} className="text-black"/>
                <div className="flex flex-col items-center">
                    <span className="text-lg md:text-xs text-gray-400 font-medium">Jam</span>
                    <span className="text-base md:text-xl font-bold mb-1">{formattedTime}</span>

                    <span className={`text-white text-lg font-bold px-3 py-0.5 rounded-full transition-colors ${
                        isLoading ? "bg-gray-400 animate-pulse" :
                        activeShift === "Error" || activeShift === "Belum Login" ? "bg-red-500" : "bg-[#ffb702]"
                    }`}>
                        {isLoading ? "Loading..." : activeShift}
                    </span>

                </div>
            </div>
        </div>
    )
}