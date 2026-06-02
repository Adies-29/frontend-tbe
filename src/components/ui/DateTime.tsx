import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ShiftData{
    kode_shift: string;
    jam_masuk: string;
    jam_pulang: string;
    lintas_hari?: boolean; 
}

export default function DateTime() {
    const [time, setTime] = useState(new Date());
    const [shiftLIst, setShiftList] = useState<ShiftData[]>([]);
    const [activeShift, setActiveShift] = useState("Memuat...");
    const [isLoading, setIsLoading] = useState(true);


    // 2. Fungsi untuk mencocokkan jam dengan data shift

    const checkCurrentShift = (currentTime: Date, shifts: ShiftData[]) =>{
        if (!shifts || shifts.length === 0) return "Error/Kosong";

        const currentHours = currentTime.getHours().toString().padStart(2, '0');
        const currentMinutes = currentTime.getMinutes().toString().padStart(2, '0');
        const timeString = `${currentHours}:${currentMinutes}`;
        
        let kosong = "--"; //diluar jam kerja

        for (const shift of shifts){
            const masuk = shift.jam_masuk.substring(0,5);
            const pulang = shift.jam_pulang.substring(0,5);

            if (shift.lintas_hari){
                if (timeString >= masuk || timeString < pulang){
                    kosong = shift.kode_shift;
                    break;
                }
            }else{
                if (timeString >= masuk && timeString < pulang){
                    kosong = shift.kode_shift;
                    break;
                }
            };
        }
        return kosong;
    };

    // data dari backend
    useEffect(() => {
        const fetchShift = async () => {
            try {
                setIsLoading(true);
                const respose = await fetch ("http://localhost:3000/api/v1/shifts");
                if (!respose.ok)
                    throw new Error("Gagal ambil data")

                const result =await respose.json();
                const dataShift = Array.isArray(result) ? result : result.data;

                setShiftList(dataShift);
                setActiveShift(checkCurrentShift(new Date(), dataShift));
                
            } catch (error) {
                console.error(error);
                setActiveShift("Error");
            } finally{
                setIsLoading(false);
            }
        };
        fetchShift();
    }, []);

    // Update Shift otomatis

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);

            //Cek shift menggunakan data yang sudah di-fetch
            if (shiftLIst.length > 0){
                setActiveShift(checkCurrentShift(now, shiftLIst));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [shiftLIst]);

    const formatedDate = time.toLocaleDateString("id-ID",{
        day: "numeric", month: "long", year: "numeric",
    });

    const formatedDay = time.toLocaleDateString("id-ID", {weekday: "long"});
    const formatedTime = time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).replace("."," : ");


    return(
        <div className="flex items-center justify-center gap-4 md:gap-10 border border-gray-300 rounded-2xl px-4 md:px-6 py-2 bg-white w-full md:w-auto">

            {/* Bagian tanggal */}
            <div className="flex items-center gap-2">
                <Calendar size={30} className="text-black"/>
                <div className="flex flex-col">
                    <span className="text-lg md:text-xs text-gray-400 font-medium ">Tangal</span>
                    <span className="text-base md:text-xl font-bold py-0.5">{formatedDate}</span>
                    <span className="text-lg md:text-lg font-semibold">{formatedDay}</span>
                </div>

            </div>


            {/* Bagian jam */}
            <div className="flex items-center gap-2">
                <Clock size={30} className="text-black"/>
                <div className="flex flex-col items-center">
                    <span className="text-lg md:text-xs text-gray-400 font-medium">Jam</span>
                    <span className="text-base md:text-xl font-bold mb-1">{formatedTime}</span>

                    <span className={`text-white text-lg font-bold px-3 py-0.5 rounded-full transition-colors ${
                        isLoading ? "bg-gray-400 animate-pulse" :
                        activeShift === "Error" ? "bg-red-500" : "bg-[#ffb702]"
                    }`}>
                        {isLoading ? "Loading..." : activeShift}
                    </span>

                </div>
            </div>
        </div>
    )
}