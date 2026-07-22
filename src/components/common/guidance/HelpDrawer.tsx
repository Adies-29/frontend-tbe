import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
    X,
    Rocket,
    Search,
    ChevronDown,
    ChevronRight,
    BookOpen,
    RotateCcw,
    CheckCircle2,
    Sparkles,
    MessageCircle,
} from 'lucide-react';
import { useGuidanceStore } from '../../../features/guidance/store/useGuidanceStore';
import {
    getGuidanceForCurrentPage,
    getAllGuidancePages,
    HELP_CENTER_SUPPORT_CONFIG,
    type GuidancePageConfig,
} from '../../../features/guidance/config/guidanceConfig';

export default function HelpDrawer() {
    const location = useLocation();
    const {
        isHelpDrawerOpen,
        closeHelpDrawer,
        completedTours,
        markTourCompleted,
        resetAllTours,
    } = useGuidanceStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'current' | 'all'>('current');

    // Panduan untuk halaman saat ini
    const currentPageGuide = getGuidanceForCurrentPage(location.pathname);
    const allGuides = getAllGuidancePages();

    // Filter panduan berdasarkan pencarian (Judul, Deskripsi, FAQ, & Keywords)
    const filteredGuides = allGuides.filter((guide) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const matchTitle = guide.title.toLowerCase().includes(q);
        const matchDesc = guide.description.toLowerCase().includes(q);
        const matchKeywords = guide.keywords?.some((k) => k.toLowerCase().includes(q));
        const matchFaqs = guide.faqs.some(
            (faq) =>
                faq.question.toLowerCase().includes(q) ||
                faq.answer.toLowerCase().includes(q)
        );
        return matchTitle || matchDesc || matchKeywords || matchFaqs;
    });

    // Auto switch ke tab 'Semua Panduan' ketika user mengetik di search bar
    useEffect(() => {
        if (searchQuery.trim().length > 0 && activeSection === 'current') {
            setActiveSection('all');
        }
    }, [searchQuery, activeSection]);

    // Fungsi untuk menjalankan Driver.js tour
    const startDriverTour = useCallback(
        (guide: GuidancePageConfig) => {
            closeHelpDrawer();

            // Beri waktu untuk drawer menutup sebelum memulai tour
            setTimeout(() => {
                const driverObj = driver({
                    showProgress: true,
                    animate: true,
                    allowClose: true,
                    disableActiveInteraction: true,
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                    stagePadding: 8,
                    stageRadius: 12,
                    popoverClass: 'guidance-popover',
                    nextBtnText: 'Lanjut →',
                    prevBtnText: '← Kembali',
                    doneBtnText: '✓ Selesai',
                    progressText: '{{current}} dari {{total}}',
                    steps: guide.tourSteps,
                    onDestroyStarted: () => {
                        markTourCompleted(guide.id);
                        driverObj.destroy();
                    },
                });

                driverObj.drive();
            }, 400);
        },
        [closeHelpDrawer, markTourCompleted]
    );

    // Tutup drawer ketika halaman berubah
    useEffect(() => {
        setSearchQuery('');
        setExpandedFaq(null);
    }, [location.pathname]);

    // Tutup drawer dengan tombol Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isHelpDrawerOpen) {
                closeHelpDrawer();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isHelpDrawerOpen, closeHelpDrawer]);

    const isTourDone = (id: string) => completedTours.includes(id);

    const tierLabel = (tier: number) => {
        switch (tier) {
            case 1:
                return { text: 'Tour Interaktif', color: 'bg-blue-100 text-blue-700' };
            case 2:
                return { text: 'Tooltip & Tips', color: 'bg-amber-100 text-amber-700' };
            case 3:
                return { text: 'Info Singkat', color: 'bg-gray-100 text-gray-600' };
            default:
                return { text: 'Panduan', color: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <>
            {/* Overlay backdrop */}
            {isHelpDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-9998 transition-opacity duration-300"
                    onClick={closeHelpDrawer}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={`
                    fixed top-0 right-0 h-full z-9999
                    w-full sm:w-[420px]
                    bg-white shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isHelpDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
                    flex flex-col
                `}
            >
                {/* ===== HEADER ===== */}
                <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen size={22} />
                            <div>
                                <h2 className="text-lg font-bold tracking-wide">Pusat Bantuan</h2>
                                <p className="text-blue-200 text-xs mt-0.5">
                                    Panduan penggunaan aplikasi T-Be
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeHelpDrawer}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Tutup"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300"
                        />
                        <input
                            type="text"
                            placeholder="Cari panduan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder-blue-200 text-sm focus:outline-none focus:bg-white/25 focus:border-white/40 transition-all"
                        />
                    </div>
                </div>

                {/* ===== KONTEN SCROLLABLE ===== */}
                <div className="flex-1 overflow-y-auto">
                    {/* Tab Switch: Halaman Ini / Semua Panduan */}
                    <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
                        <button
                            onClick={() => setActiveSection('current')}
                            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
                                activeSection === 'current'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Halaman Ini
                        </button>
                        <button
                            onClick={() => setActiveSection('all')}
                            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
                                activeSection === 'all'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Semua Panduan
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* ========== SECTION: HALAMAN INI ========== */}
                        {activeSection === 'current' && (
                            <>
                                {currentPageGuide ? (
                                    <>
                                        {/* Tombol Mulai Tour */}
                                        <button
                                            onClick={() => startDriverTour(currentPageGuide)}
                                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <Rocket size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-800">
                                                    Mulai Tour Interaktif
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Panduan langkah-demi-langkah untuk halaman ini
                                                </p>
                                            </div>
                                            {isTourDone(currentPageGuide.id) && (
                                                <CheckCircle2
                                                    size={18}
                                                    className="text-green-500 ml-auto shrink-0"
                                                />
                                            )}
                                        </button>

                                        {/* Info Halaman */}
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">
                                                    {currentPageGuide.icon}
                                                </span>
                                                <h3 className="font-bold text-gray-800">
                                                    {currentPageGuide.title}
                                                </h3>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                                        tierLabel(currentPageGuide.tier).color
                                                    }`}
                                                >
                                                    {tierLabel(currentPageGuide.tier).text}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {currentPageGuide.description}
                                            </p>
                                        </div>

                                        {/* FAQ */}
                                        {currentPageGuide.faqs.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Sparkles size={14} className="text-amber-500" />
                                                    Pertanyaan Umum (FAQ)
                                                </h4>
                                                <div className="space-y-2">
                                                    {currentPageGuide.faqs.map((faq, idx) => {
                                                        const faqKey = `${currentPageGuide.id}-${idx}`;
                                                        const isOpen = expandedFaq === faqKey;
                                                        return (
                                                            <div
                                                                key={faqKey}
                                                                className="border border-gray-200 rounded-xl overflow-hidden transition-all"
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        setExpandedFaq(
                                                                            isOpen ? null : faqKey
                                                                        )
                                                                    }
                                                                    className="w-full text-left p-3 flex items-start gap-2 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    {isOpen ? (
                                                                        <ChevronDown
                                                                            size={16}
                                                                            className="text-blue-500 mt-0.5 shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <ChevronRight
                                                                            size={16}
                                                                            className="text-gray-400 mt-0.5 shrink-0"
                                                                        />
                                                                    )}
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {faq.question}
                                                                    </span>
                                                                </button>
                                                                {isOpen && (
                                                                    <div className="px-4 pb-3 text-sm text-gray-600 bg-blue-50/50 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                        <p className="pt-2">
                                                                            {faq.answer}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                                        <p className="text-sm font-medium">
                                            Belum ada panduan khusus untuk halaman ini.
                                        </p>
                                        <p className="text-xs mt-1">
                                            Coba lihat tab "Semua Panduan" untuk daftar lengkap.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ========== SECTION: SEMUA PANDUAN ========== */}
                        {activeSection === 'all' && (
                            <div className="space-y-2">
                                {(searchQuery ? filteredGuides : allGuides).map((guide) => (
                                    <div
                                        key={guide.id}
                                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{guide.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-sm font-bold text-gray-800">
                                                        {guide.title}
                                                    </h4>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                                            tierLabel(guide.tier).color
                                                        }`}
                                                    >
                                                        {tierLabel(guide.tier).text}
                                                    </span>
                                                    {isTourDone(guide.id) && (
                                                        <CheckCircle2
                                                            size={14}
                                                            className="text-green-500"
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {guide.description}
                                                </p>
                                            </div>
                                            {guide.tourSteps.length > 0 && (
                                                <button
                                                    onClick={() => startDriverTour(guide)}
                                                    className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    ▶ Mulai
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {searchQuery && filteredGuides.length === 0 && (
                                    <div className="text-center py-10 text-gray-400">
                                        <Search size={32} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">
                                            Tidak ditemukan panduan untuk "{searchQuery}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== BANNER BANTUAN DIRECT WHATSAPP ===== */}
                        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs mt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-900">Kendala Teknis Aplikasi?</h4>
                                    <p className="text-[11px] text-emerald-700 font-medium">Hubungi Customer Support via WA</p>
                                </div>
                            </div>
                            <a
                                href={`https://wa.me/${HELP_CENTER_SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(HELP_CENTER_SUPPORT_CONFIG.messageText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                Chat WA
                            </a>
                        </div>
                    </div>
                </div>

                {/* ===== FOOTER ===== */}
                <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 shrink-0 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                        {completedTours.length} / {allGuides.length} panduan selesai
                    </div>
                    {completedTours.length > 0 && (
                        <button
                            onClick={resetAllTours}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <RotateCcw size={12} />
                            Reset Semua
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
