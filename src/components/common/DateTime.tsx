import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
// 1. Import useAuthStore untuk mengambil token
import { useAuthStore } from "../../store/useAuthStore";
import { apiFetch } from "../../utils/apiFetch";

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

            // Deteksi cerdas: jika shift di database tidak ditandai lintas hari,
            // tapi jam pulang <= jam masuk (misal 21:00 s.d 00:00), maka secara logika itu adalah lintas hari
            const isLintasHari = shift.lintas_hari || pulang <= masuk;

            if (isLintasHari) {
                if (timeString >= masuk || timeString < pulang) {
                    kosong = shift.kode_shift;
                    break;
                }
            } else {
                if (timeString >= masuk && timeString < pulang) {
                    kosong = shift.kode_shift;
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
                const response = await apiFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/shifts`, {
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

    return (
        <div className="flex items-center justify-center md:justify-center gap-2 md:gap-10 border border-gray-300 rounded-2xl px-4 md:px-8 py-2 bg-white w-full md:w-auto shadow-sm">

            {/* Bagian tanggal */}
            <div className="flex items-center gap-2 md:gap-3 flex-1">
                <Calendar className="w-5 h-5 md:w-8 md:h-8 text-black shrink-0" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider">Tanggal</span>
                    <span className="text-sm md:text-xl font-bold text-gray-900 leading-tight my-0.5">{formattedDate}</span>
                    <span className="text-xs md:text-sm font-semibold text-gray-600">{formattedDay}</span>
                </div>
            </div>


            {/* Bagian jam */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 pl-2 md:pl-0">
                <Clock className="w-5 h-5 md:w-8 md:h-8 text-black shrink-0" />
                <div className="flex flex-col items-start md:items-center">
                    <span className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider">Jam</span>
                    <span className="text-sm md:text-xl font-bold text-gray-900 leading-tight my-0.5">{formattedTime}</span>

                    <span className={`text-white text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${isLoading ? "bg-gray-400 animate-pulse" :
                            activeShift === "Error" || activeShift === "Belum Login" ? "bg-red-500" : "bg-[#ffb702]"
                        }`}>
                        {isLoading ? "Loading..." : activeShift}
                    </span>
                </div>
            </div>
        </div>
    )
}