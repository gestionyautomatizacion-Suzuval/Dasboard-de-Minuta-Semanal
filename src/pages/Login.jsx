import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Car, LogIn, UserPlus, CheckCircle } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [sucursal, setSucursal] = useState('SAN ANTONIO');
    const [rol, setRol] = useState('Vendedor');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, currentUser, loading: authLoading, resetPassword } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && currentUser) {
            navigate('/');
        }
    }, [currentUser, authLoading, navigate]);

    const sucursales = ["SAN ANTONIO", "VIÑA DEL MAR", "LA CALERA", "ESPACIO URBANO", "VALPARAISO", "VALPO USADO", "VIÑA USADO", "MELIPILLA", "CONCON"];

    // Solo el usuario gestionyautomatizacion@suzuval.cl puede ver el rol Supervisor
    const availableRoles = email === 'gestionyautomatizacion@suzuval.cl'
        ? ["Vendedor", "Jefe de Venta", "Supervisor"]
        : ["Vendedor", "Jefe de Venta"];

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                // Navigation will be handled by AuthContext reading role and ProtectedRoute, but we can do a general redirect
                navigate('/');
            } else {
                await signup(email, password, nombre, sucursal, rol);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                        <Car size={32} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Suzuval
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Plataforma de Compromisos Semanales
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">

                    <div className="flex mb-6 border-b border-gray-200">
                        <button
                            className={`flex-1 py-2 text-center font-medium transition-colors duration-200 ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            className={`flex-1 py-2 text-center font-medium transition-colors duration-200 ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Registrarse
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 border-l-4 border-green-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                <div className="mt-1">
                                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="mt-1">
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="mt-1">
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sucursal</label>
                                    <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
                                        {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <select value={rol} onChange={(e) => setRol(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
                                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <button disabled={loading} type="submit" className="w-full flex justify-center py-2 px-4 flex items-center gap-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50">
                                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                {isLogin ? 'Ingresar' : 'Crear cuenta'}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="text-center">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        )}
                    </form>

                </div>
            </div>
        </div>
    );
}
