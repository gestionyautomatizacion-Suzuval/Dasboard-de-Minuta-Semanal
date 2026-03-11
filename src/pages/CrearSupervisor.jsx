import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, UserPlus, ArrowLeft } from 'lucide-react';

const sucursales = ["SAN ANTONIO", "VIÑA DEL MAR", "LA CALERA", "ESPACIO URBANO", "VALPARAISO", "VALPO USADO", "VIÑA USADO", "MELIPILLA", "CONCON"];
const roles = ["Vendedor", "Jefe de Venta", "Supervisor"];

export default function CrearSupervisor() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [sucursal, setSucursal] = useState('SAN ANTONIO');
    const [rol, setRol] = useState('Supervisor');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await signup(email, password, nombre, sucursal, rol);
            setSuccess(`✅ Usuario "${nombre}" creado correctamente con rol ${rol}.`);
            setEmail(''); setPassword(''); setNombre('');
            setSucursal('SAN ANTONIO'); setRol('Supervisor');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Ya existe una cuenta con ese correo.');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else {
                setError('Error: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-purple-600 text-white p-3 rounded-xl shadow-lg">
                        <Shield size={32} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crear Usuario
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Panel de administración — Suzuval
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text" required value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input
                                type="email" required value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input
                                type="password" required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sucursal</label>
                            <select
                                value={sucursal} onChange={(e) => setSucursal(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select
                                value={rol} onChange={(e) => setRol(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                        >
                            <UserPlus size={18} />
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft size={14} /> Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
