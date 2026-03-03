/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPortal from './pages/DoctorPortal';
import PatientDashboard from './pages/PatientDashboard';
import PatientPortal from './pages/PatientPortal';
import StaffPortal from './pages/StaffPortal';
import SystemSettings from './pages/SystemSettings';
import BedManagement from './pages/BedManagement';
import Staffing from './pages/Staffing';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import HospitalServices from './pages/HospitalServices';
import Records from './pages/Records';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import BillingPortal from './pages/BillingPortal';
import LabTechPortal from './pages/LabTechPortal';
import PharmacistPortal from './pages/PharmacistPortal';
import RadiologistPortal from './pages/RadiologistPortal';
import MaintenanceScreen from './components/MaintenanceScreen';

function GlobalMaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = React.useState(false);

  React.useEffect(() => {
    const checkMaintenance = () => {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setIsMaintenanceMode(parsed.isMaintenanceMode || false);
      }
    };
    
    checkMaintenance();
    window.addEventListener('settingsUpdated', checkMaintenance);
    return () => window.removeEventListener('settingsUpdated', checkMaintenance);
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (isMaintenanceMode && user && user.role !== 'superadmin') {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) return <Navigate to="/" />;
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if they try to access unauthorized route
    if (user.role === 'superadmin') return <Navigate to="/dashboard" />;
    if (user.role === 'admin') return <Navigate to="/dashboard" />;
    if (user.role === 'doctor') return <Navigate to="/dashboard" />;
    if (user.role === 'patient') return <Navigate to="/dashboard" />;
    if (user.role === 'staff') return <Navigate to="/dashboard" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// ... existing imports ...

function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" />;

  // Route to the correct dashboard based on role
  if (user.role === 'superadmin') return <SuperAdminDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'doctor') return <DoctorDashboard />;
  if (user.role === 'patient') return <PatientPortal />;
  if (user.role === 'nurse') return <StaffPortal />;
  if (user.role === 'accountant') return <BillingPortal />;
  if (user.role === 'lab_tech') return <LabTechPortal />;
  if (user.role === 'pharmacist') return <PharmacistPortal />;
  if (user.role === 'radiologist') return <RadiologistPortal />;
  if (user.role === 'staff') return <StaffPortal />; // Fallback
  
  return <div>Unknown Role</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <GlobalMaintenanceWrapper>
            <Routes>
              <Route path="/" element={<Login />} />
              
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardRouter />} />
                
                {/* Specific routes can be added here with RoleBasedRoute wrappers */}
                <Route path="/tenants" element={<RoleBasedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></RoleBasedRoute>} />
                <Route path="/settings" element={<RoleBasedRoute allowedRoles={['superadmin']}><SystemSettings /></RoleBasedRoute>} />
                <Route path="/portal" element={<RoleBasedRoute allowedRoles={['doctor']}><DoctorPortal /></RoleBasedRoute>} />
                <Route path="/staff-portal" element={<RoleBasedRoute allowedRoles={['staff', 'nurse']}><StaffPortal /></RoleBasedRoute>} />
                <Route path="/billing-portal" element={<RoleBasedRoute allowedRoles={['accountant']}><BillingPortal /></RoleBasedRoute>} />
                <Route path="/lab-portal" element={<RoleBasedRoute allowedRoles={['lab_tech']}><LabTechPortal /></RoleBasedRoute>} />
                <Route path="/pharmacy-portal" element={<RoleBasedRoute allowedRoles={['pharmacist']}><PharmacistPortal /></RoleBasedRoute>} />
                <Route path="/radiology-portal" element={<RoleBasedRoute allowedRoles={['radiologist']}><RadiologistPortal /></RoleBasedRoute>} />
                <Route path="/prescriptions" element={<RoleBasedRoute allowedRoles={['doctor']}><Prescriptions /></RoleBasedRoute>} />
                <Route path="/patient-portal" element={<RoleBasedRoute allowedRoles={['patient']}><PatientPortal /></RoleBasedRoute>} />
                <Route path="/symptom-checker" element={<RoleBasedRoute allowedRoles={['patient']}><PatientDashboard /></RoleBasedRoute>} />
                <Route path="/patients" element={<RoleBasedRoute allowedRoles={['doctor', 'admin']}><Patients /></RoleBasedRoute>} />
                <Route path="/beds" element={<RoleBasedRoute allowedRoles={['admin']}><BedManagement /></RoleBasedRoute>} />
                <Route path="/staffing" element={<RoleBasedRoute allowedRoles={['admin']}><Staffing /></RoleBasedRoute>} />
                <Route path="/appointments" element={<RoleBasedRoute allowedRoles={['doctor', 'admin', 'patient']}><Appointments /></RoleBasedRoute>} />
                <Route path="/records" element={<RoleBasedRoute allowedRoles={['patient', 'doctor']}><Records /></RoleBasedRoute>} />
                <Route path="/services" element={<RoleBasedRoute allowedRoles={['admin', 'doctor', 'patient']}><HospitalServices /></RoleBasedRoute>} />
                <Route path="/billing" element={<RoleBasedRoute allowedRoles={['admin']}><Billing /></RoleBasedRoute>} />
              </Route>
            </Routes>
          </GlobalMaintenanceWrapper>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
