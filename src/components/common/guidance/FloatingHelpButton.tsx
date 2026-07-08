import { HelpCircle } from 'lucide-react';
import { useGuidanceStore } from '../../../features/guidance/store/useGuidanceStore';

export default function FloatingHelpButton() {
    const toggleHelpDrawer = useGuidanceStore((s) => s.toggleHelpDrawer);
    const isHelpDrawerOpen = useGuidanceStore((s) => s.isHelpDrawerOpen);

    return (
        <button
            onClick={toggleHelpDrawer}
            aria-label="Pusat Bantuan"
            title="Pusat Bantuan"
            className={`
                fixed bottom-6 right-6 z-9998
                w-14 h-14 rounded-full
                bg-linear-to-br from-blue-600 to-indigo-700
                text-white shadow-lg shadow-blue-500/30
                flex items-center justify-center
                transition-all duration-300 ease-in-out
                hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40
                active:scale-95
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
    );
}
