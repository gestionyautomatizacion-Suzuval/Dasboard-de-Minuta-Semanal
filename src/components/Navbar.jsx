import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Car, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm z-10 sticky top-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Car size={24} />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 tracking-tight">
                        Suzuval <span className="text-gray-500 font-medium text-lg hidden sm:inline">Compromisos</span>
                    </h1>
                </div>

                {currentUser && userData && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-semibold text-gray-900">{userData.nombre}</span>
                            <span className="text-xs text-gray-500">{userData.rol} • {userData.sucursal}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
