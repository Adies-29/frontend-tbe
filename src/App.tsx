
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import JadwalShiftIndex from './pages/dashboard/jadwalshift/JadwalShiftIndex';
import DepartemenIndex from './pages/dashboard/departemen/DepartemenIndex';
import AddDepartemen from './pages/dashboard/departemen/AddDepartemen';
import DetailDepartemen from './pages/dashboard/departemen/DetailDepartemen';
import GajiTunjanganIndex from './pages/dashboard/gajitunjangan/GajiTunjanganIndex';
import JabatanIndex from './pages/dashboard/jabatan/JabatanIndex';
import AturGajiJabatan from './pages/dashboard/gajitunjangan/AturGajiJabatan';
import AddJabatan from './pages/dashboard/jabatan/AddJabatan';
import Home from './pages/Home';
import AddShift from './pages/dashboard/jadwalshift/AddShift';
import EditShift from './pages/dashboard/jadwalshift/EditShift';
import EditPegawai from './pages/dashboard/pegawai/EditPegawai';
import DetailPegawai from './pages/dashboard/pegawai/DetailPegawai';
import AddPegawai from './pages/dashboard/pegawai/AddPegawai';
import PegawaiIndex from './pages/dashboard/pegawai/PegawaiIndex';
import LemburIndex from './pages/dashboard/lembur/LemburIndex';
import AddLembur from './pages/dashboard/lembur/AddLembur';

function App() {
  return (
    <BrowserRouter>
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
            <Route path="/dashboard/departemen/:id" element={<DetailDepartemen />} />


            <Route path="/dashboard/jabatan" element={<JabatanIndex/>} />
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
    </BrowserRouter>
  );
}

export default App
