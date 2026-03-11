import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userData } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // If roles are specified and the user role is not in the list, redirect to their main page or show unauthorized
    if (allowedRoles && userData && !allowedRoles.includes(userData.rol)) {
        // Basic redirect map based on role
        switch (userData.rol) {
            case 'Jefe de Venta':
                return <Navigate to="/jefe-venta" replace />;
            case 'Supervisor':
                return <Navigate to="/supervisor" replace />;
            case 'Vendedor':
                return <Navigate to="/vendedor" replace />;
            default:
                return <Navigate to="/" replace />; // Fallback
        }
    }

    return children;
}
