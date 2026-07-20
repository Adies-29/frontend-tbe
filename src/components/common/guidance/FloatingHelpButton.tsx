import { useState } from 'react';
import { HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGuidanceStore } from '../../../features/guidance/store/useGuidanceStore';

export default function FloatingHelpButton() {
    const toggleHelpDrawer = useGuidanceStore((s) => s.toggleHelpDrawer);
    const isHelpDrawerOpen = useGuidanceStore((s) => s.isHelpDrawerOpen);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (isCollapsed) {
        return (
            <button
                onClick={() => {
                    setIsCollapsed(false);
                    toggleHelpDrawer();
                }}
                aria-label="Buka Pusat Bantuan"
                title="Klik untuk membuka Pusat Bantuan"
                className="fixed right-0 bottom-24 z-9998 bg-gradient-to-l from-indigo-700 to-blue-600 text-white rounded-l-xl py-2.5 pl-3 pr-2 shadow-lg shadow-blue-500/20 flex items-center gap-1.5 hover:-translate-x-1 transition-all group border-l border-y border-blue-400/30 cursor-pointer"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-9998 flex items-center group/container">
            {/* Tombol Hide ke Tepi */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(true);
                }}
                aria-label="Sembunyikan ke tepi"
                title="Sembunyikan ke tepi layar"
                className="absolute -top-1 -right-1 z-20 bg-gray-800 hover:bg-gray-900 text-white rounded-full p-1 shadow-md border border-gray-600 transition-transform hover:scale-110 cursor-pointer"
            >
                <ChevronRight size={14} />
            </button>

            <button
                onClick={toggleHelpDrawer}
                aria-label=""
                title=""
                className={`
                    w-14 h-14 rounded-full
                    bg-linear-to-br from-blue-600 to-indigo-700
                    text-white shadow-lg shadow-blue-500/30
                    flex items-center justify-center
                    transition-all duration-300 ease-in-out
                    hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40
                    active:scale-95 cursor-pointer
                    ${isHelpDrawerOpen ? 'rotate-45 bg-linear-to-br from-red-500 to-red-700 shadow-red-500/30' : ''}
                    group
                `}
            >
                {/* Pulsing Ring Animation (hanya saat drawer tertutup) */}
                {!isHelpDrawerOpen && (
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
                )}

                <HelpCircle
                    size={26}
                    strokeWidth={2.5}
                    className="relative z-10 transition-transform duration-300"
                />
            </button>
        </div>
    );
}

