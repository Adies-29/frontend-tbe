import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';



const Home = lazy(() => import('./features/landing/pages/Home'))
const Login = lazy(() => import('./features/auth/pages/Login'))
const DashboardIndex = lazy(() => import('./features/dashboard/pages/DashboardIndex'))

const DepartemenIndex = lazy(() => import('./features/departemen/pages/DepartemenIndex'))
const JabatanIndex = lazy(() => import('./features/jabatan/pages/JabatanIndex'))
const GajiTunjanganIndex = lazy(() => import('./features/gajiTunjangan/pages/GajiTunjanganIndex'))
const PegawaiIndex = lazy(() => import('./features/pegawai/pages/PegawaiIndex'))
const LemburIndex = lazy(() => import('./features/lembur/pages/LemburIndex'))
const JadwalShiftIndex = lazy(() => import('./features/jadwalShift/pages/JadwalShiftIndex'))

const AddDepartemen = lazy(() => import('./features/departemen/pages/AddDepartemen'))
const AddPegawai = lazy(() => import('./features/pegawai/pages/AddPegawai'))
const AddJabatan = lazy(() => import('./features/jabatan/pages/AddJabatan'))
const AddShift = lazy(() => import('./features/jadwalShift/pages/AddShift'))
const AddLembur = lazy(() => import('./features/lembur/pages/AddLembur'))
const TargetPackingIndex = lazy(() => import('./features/targetPacking/pages/TargetPackingIndex'))
const KasbonIndex = lazy(() => import('./features/kasbon/pages/KasbonIndex'))
const AddKasbon = lazy(() => import('./features/kasbon/pages/AddKasbon'))

const EditPegawai = lazy(() => import('./features/pegawai/pages/EditPegawai'))
const EditShift = lazy(() => import('./features/jadwalShift/pages/EditShift'))
const EditLembur = lazy(() => import('./features/lembur/pages/EditLembur'))
const AturGajiJabatan = lazy(() => import('./features/gajiTunjangan/pages/AturGajiJabatan'))

const DetailPegawai = lazy(() => import('./features/pegawai/pages/DetailPegawai'))

const BonusCustomIndex = lazy(() => import('./features/bonusCustom/pages/BonusCustomIndex'))
const PotonganCustomIndex = lazy(() => import('./features/potonganCustom/pages/PotonganCustomIndex'))


function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
      refetchOnWindowFocus: false, // Menghindari hit API berulang saat pindah tab browser
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            <Route path="/" element={<Home />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* halaman khusus login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/tv" element={
                <div className="p-6 bg-gray-50 min-h-screen">
                  <DashboardIndex />
                </div>
              } />
              <Route element={<DashboardLayout />}>

                {/* RUTE UNTUK SEMUA ROLE (ADMIN & MANDOR) */}
                <Route path="/dashboard" element={<DashboardIndex />} />
                <Route path="/dashboard/target-packing" element={<TargetPackingIndex />} />


                {/* RUTE KHUSUS ADMIN */}
                <Route element={<ProtectedRoute allowedRoles={["admin", "hrd"]} />}>
                  <Route path="/dashboard/data-pegawai" element={<PegawaiIndex />} />
                  <Route path="/dashboard/data-pegawai/tambah-pegawai" element={<AddPegawai />} />
                  <Route path="/dashboard/data-pegawai/:id" element={<DetailPegawai />} />
                  <Route path="/dashboard/data-pegawai/edit/:id" element={<EditPegawai />} />


                  <Route path="/dashboard/departemen" element={<DepartemenIndex />} />
                  <Route path="/dashboard/departemen/tambah-departemen" element={<AddDepartemen />} />


                  <Route path="/dashboard/jabatan" element={<JabatanIndex />} />
                  <Route path="/dashboard/jabatan/tambah-jabatan" element={<AddJabatan />} />


                  <Route path="/dashboard/jadwal-shift" element={<JadwalShiftIndex />} />
                  <Route path="/dashboard/jadwal-shift/tambah" element={<AddShift />} />
                  <Route path="/dashboard/jadwal-shift/edit/:id" element={<EditShift />} />


                  <Route path="/dashboard/gaji-tunjangan" element={<GajiTunjanganIndex />} />
                  <Route path="/dashboard/gaji-tunjangan/master-gaji/:id" element={<AturGajiJabatan />} />

                  <Route path="/dashboard/kasbon" element={<KasbonIndex />} />
                  <Route path="/dashboard/kasbon/tambah" element={<AddKasbon />} />

                  <Route path="/dashboard/bonus-custom" element={<BonusCustomIndex />} />
                  <Route path="/dashboard/potongan-custom" element={<PotonganCustomIndex />} />
                </Route>

                {/* RUTE ADMIN, HRD, DAN MANDOR */}
                <Route element={<ProtectedRoute allowedRoles={["admin", "hrd", "mandor"]} />}>
                  <Route path="/dashboard/lembur" element={<LemburIndex />} />
                  <Route path="/dashboard/lembur/tambah-lembur" element={<AddLembur />} />
                  <Route path="/dashboard/lembur/edit/:id" element={<EditLembur />} />
                </Route>

              </Route>
            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App
