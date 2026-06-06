import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const closeSidebar = () => setIsSidebarOpen(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex w-full min-h-screen bg-gray-100 relative overflow-hidden">
            
            {/* Header Mobile */}
            <div className="md:hidden flex flex-row items-center justify-between bg-[#C90003] p-4 text-white w-full fixed top-0 z-40 shadow-md">
                <div className="flex flex-col">
                    <h1 className="font-bold text-xl tracking-wider">T-Be
                        <span className="text-sm block">(tiga berlian)</span>
                    </h1>
                </div>
             
                <button onClick={toggleSidebar} className="p-1 hover:bg-red-800 rounded">
                    <Menu size={28} />
                </button>
            </div>

            
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={closeSidebar}
                ></div>
            )}

          
            <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} toggleSidebar={toggleSidebar} />

            {/* --- KANAN (Main Content) --- */}
            <div 
                className={`flex-1 bg-gray-50 flex flex-col h-screen min-w-0 transition-all duration-300 ease-in-out
                ${isSidebarOpen ? "md:ml-65" : "md:ml-20"}`}
            >
                
                <div className="pt-20 md:pt-0"> 
                    <Header />
                </div>

                {/* Area Konten Dinamis (Tabel, Grafik, dll nanti masuk ke sini) */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden min-w-0">
                    <Outlet />
                </div>
                
            </div>
            
        </div>
    );
}