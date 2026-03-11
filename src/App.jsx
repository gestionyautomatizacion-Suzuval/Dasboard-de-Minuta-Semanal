import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import DashboardGerencia from './components/DashboardGerencia';
import PortalVendedor from './components/PortalVendedor';
import DashboardSupervisor from './pages/DashboardSupervisor';
import ForgotPassword from './pages/ForgotPassword';
import CrearSupervisor from './pages/CrearSupervisor';

function DashboardRedirect() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  switch (userData.rol) {
    case 'Jefe de Venta': return <Navigate to="/jefe-venta" replace />;
    case 'Supervisor': return <Navigate to="/jefe-venta" replace />;
    case 'Vendedor': return <Navigate to="/vendedor" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#f4f5f7] flex flex-col font-sans">
          <Navbar />

          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/suzuval-admin-crear" element={<CrearSupervisor />} />

              <Route path="/vendedor" element={
                <ProtectedRoute allowedRoles={['Vendedor']}>
                  <PortalVendedor />
                </ProtectedRoute>
              } />

              <Route path="/jefe-venta" element={
                <ProtectedRoute allowedRoles={['Jefe de Venta', 'Supervisor']}>
                  <DashboardGerencia />
                </ProtectedRoute>
              } />

              <Route path="/supervisor" element={
                <ProtectedRoute allowedRoles={['Supervisor']}>
                  <DashboardSupervisor />
                </ProtectedRoute>
              } />

              {/* Default redirect based on role */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
