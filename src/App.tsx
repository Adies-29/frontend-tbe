import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';


const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const DashboardIndex = lazy(() => import('./pages/dashboard/DashboardIndex'))

const DepartemenIndex = lazy(() => import('./pages/dashboard/departemen/DepartemenIndex'))
const JabatanIndex = lazy(() => import('./pages/dashboard/jabatan/JabatanIndex'))
const GajiTunjanganIndex = lazy(() => import('./pages/dashboard/gajitunjangan/GajiTunjanganIndex'))
const PegawaiIndex = lazy(() => import('./pages/dashboard/pegawai/PegawaiIndex'))
const LemburIndex = lazy(() => import('./pages/dashboard/lembur/LemburIndex'))
const JadwalShiftIndex = lazy(() => import('./pages/dashboard/jadwalshift/JadwalShiftIndex'))

const AddDepartemen = lazy(() => import('./pages/dashboard/departemen/AddDepartemen'))
const AddPegawai = lazy(() => import('./pages/dashboard/pegawai/AddPegawai'))
const AddJabatan = lazy(() => import('./pages/dashboard/jabatan/AddJabatan'))
const AddShift = lazy(() => import('./pages/dashboard/jadwalshift/AddShift'))
const AddLembur = lazy(() => import('./pages/dashboard/lembur/AddLembur'))

const EditPegawai = lazy(() => import('./pages/dashboard/pegawai/EditPegawai'))
const EditShift = lazy(() => import('./pages/dashboard/jadwalshift/EditShift'))
const AturGajiJabatan = lazy(() => import('./pages/dashboard/gajitunjangan/AturGajiJabatan'))

const DetailPegawai = lazy(() => import('./pages/dashboard/pegawai/DetailPegawai'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
    </div>
  );
}

function App() {
  return (
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

              <Route path="/dashboard" element={<DashboardIndex />} />


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

              <Route path="/dashboard/lembur" element={<LemburIndex />} />
              <Route path="/dashboard/lembur/tambah-lembur" element={<AddLembur />} />

            </Route>
          </Route>

        </Routes>
      </Suspense>
    </BrowserRouter>

  );
}

export default App
