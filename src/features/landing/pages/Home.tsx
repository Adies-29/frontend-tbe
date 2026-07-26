import { useNavigate } from 'react-router-dom';
import { ChevronRight, Fingerprint } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#faf9f7] text-gray-900 overflow-hidden relative flex flex-col">

            {/* Inline Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes blobFloat1 {
                    0%, 100% { transform: translate(-64px, 0px) scale(1); }
                    33% { transform: translate(-40px, -30px) scale(1.05); }
                    66% { transform: translate(-80px, 20px) scale(0.95); }
                }
                @keyframes blobFloat2 {
                    0%, 100% { transform: translate(64px, 32px) scale(1); }
                    33% { transform: translate(40px, 60px) scale(1.08); }
                    66% { transform: translate(90px, 10px) scale(0.92); }
                }
                @keyframes blobFloat3 {
                    0%, 100% { transform: translate(0px, 16px) scale(1); }
                    50% { transform: translate(20px, -20px) scale(1.06); }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(201, 0, 3, 0.3); }
                    50% { box-shadow: 0 0 20px 8px rgba(201, 0, 3, 0.1); }
                }
                .anim-fade-up-1 { animation: fadeInUp 0.8s ease-out both; }
                .anim-fade-up-2 { animation: fadeInUp 0.8s ease-out 0.2s both; }
                .anim-fade-up-3 { animation: fadeInUp 0.8s ease-out 0.4s both; }
                .anim-fade-up-4 { animation: fadeInUp 0.8s ease-out 0.6s both; }
                .anim-fade-in { animation: fadeIn 1.2s ease-out 0.3s both; }
                .anim-blob-1 { animation: blobFloat1 8s ease-in-out infinite; }
                .anim-blob-2 { animation: blobFloat2 10s ease-in-out infinite; }
                .anim-blob-3 { animation: blobFloat3 7s ease-in-out infinite; }
                .anim-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
            `}</style>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 anim-fade-in">
                <span className="text-sm font-bold tracking-tight text-gray-800">T-Be (tiga berlian)</span>
                <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-gray-500 hover:text-[#C90003] transition-colors duration-300"
                >
                    Login →
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-24 pt-8">

                {/* Animated Gradient Blobs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[60%] w-150 h-100 pointer-events-none">
                    <div className="absolute inset-0 rounded-full bg-[#FFb702]/20 blur-[100px] anim-blob-1" />
                    <div className="absolute inset-0 rounded-full bg-[#C90003]/12 blur-[100px] anim-blob-2" />
                    <div className="absolute inset-0 rounded-full bg-[#FFb702]/10 blur-[80px] anim-blob-3" />
                </div>

                {/* Heading */}
                <h1
                    className="relative text-4xl sm:text-5xl md:text-6xl font-light leading-[1.15] max-w-2xl tracking-tight text-gray-800 anim-fade-up-1"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                    Sistem{' '}
                    <span className="text-[#C90003] font-normal">Absensi</span>
                    {' '}yang mempermudah
                    {' '}pengelolaan{' '}
                    <span className="text-[#C90003] font-normal">pegawai</span>
                </h1>

                {/* Subtitle */}
                <p className="relative text-sm sm:text-base text-gray-500 mt-5 max-w-md leading-relaxed anim-fade-up-2">
                    Kelola kehadiran, jadwal shift, dan penggajian pegawai secara otomatis dalam satu platform.
                </p>

                {/* CTA Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="relative group mt-8 bg-[#C90003] hover:bg-[#a80002] text-white font-semibold rounded-full px-8 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#C90003]/20 hover:scale-[1.02] flex items-center gap-2 anim-fade-up-3 anim-pulse-glow"
                >
                    Masuk ke Dashboard
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                {/* Trust Indicators */}
                <div className="relative flex items-center gap-6 mt-8 anim-fade-up-4">
                    <div className="flex items-center gap-1.5">
                        <Fingerprint size={14} className="text-[#FFb702]" />
                        <span className="text-[11px] text-gray-400 font-medium">Fingerprint Ready</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-400 font-medium">Terintegrasi Penggajian</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-5 text-center anim-fade-in">
                <p className="text-[11px] text-gray-500">
                    &copy; {new Date().getFullYear()} T-Be (tiga berlian) by R3A Studio &bull; All Rights Reserved
                </p>
            </footer>
        </div>
    );
}