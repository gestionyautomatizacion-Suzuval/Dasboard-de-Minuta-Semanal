import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import { Clock, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SUCURSALES = ["Todas", "SAN ANTONIO", "VIÑA DEL MAR", "LA CALERA", "ESPACIO URBANO", "VALPARAISO", "VALPO USADO", "VIÑA USADO", "MELIPILLA", "CONCON"];

export default function DashboardSupervisor() {
    const { userData } = useAuth();
    const [minutas, setMinutas] = useState([]);
    const [filterEstado, setFilterEstado] = useState('Todos'); // 'Todos', 'Pendiente', 'Firmado'
    const [filterSucursal, setFilterSucursal] = useState('Todas');
    const [metrics, setMetrics] = useState({ total: 0, pendientes: 0, firmados: 0 });

    useEffect(() => {
        const q = query(collection(db, 'minutas_semanales'), orderBy('fecha_creacion', 'desc'));

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMinutas(data);
        }, (err) => {
            // Fallback for missing index on orderBy
            const qFallback = collection(db, 'minutas_semanales');
            onSnapshot(qFallback, (snapFallback) => {
                const dataFallback = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                dataFallback.sort((a, b) => b.fecha_creacion?.toMillis() - a.fecha_creacion?.toMillis());
                setMinutas(dataFallback);
            });
        });
        return () => unsub();
    }, []);

    const filteredMinutas = minutas.filter(m => {
        const matchEstado = filterEstado === 'Todos' || m.estado === filterEstado;
        const matchSucursal = filterSucursal === 'Todas' || m.sucursal === filterSucursal;
        return matchEstado && matchSucursal;
    });

    useEffect(() => {
        // Update metrics based on currently selected Sucursal filter
        const relevant = minutas.filter(m => filterSucursal === 'Todas' || m.sucursal === filterSucursal);
        const pend = relevant.filter(m => m.estado !== 'Firmado').length;
        const firm = relevant.filter(m => m.estado === 'Firmado').length;
        setMetrics({ total: relevant.length, pendientes: pend, firmados: firm });
    }, [minutas, filterSucursal]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Visión Global Supervisión</h2>
                        <p className="text-sm text-gray-500">Hola, {userData?.nombre}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-center">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Firmados</div>
                        <div className="text-xl font-bold text-emerald-600">{metrics.firmados}</div>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-center">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Pendientes</div>
                        <div className="text-xl font-bold text-amber-500">{metrics.pendientes}</div>
                    </div>
                </div>
            </div>

            {/* SECTION: Tablero de Seguimiento (Estilo Monday) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Estado de Compromisos Semanales</h2>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative">
                            <select
                                value={filterSucursal}
                                onChange={e => setFilterSucursal(e.target.value)}
                                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 pr-8 shadow-sm"
                            >
                                {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilterEstado('Todos')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterEstado === 'Todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterEstado('Pendiente')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${filterEstado === 'Pendiente' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-amber-700'}`}
                            >
                                <Clock size={14} /> Pendientes
                            </button>
                            <button
                                onClick={() => setFilterEstado('Firmado')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${filterEstado === 'Firmado' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-emerald-700'}`}
                            >
                                <CheckCircle size={14} /> Firmados
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sucursal</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resumen Metas</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comentarios</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredMinutas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No hay minutas que coincidan con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                filteredMinutas.map((minuta) => {
                                    const dateObj = minuta.fecha_creacion?.toDate ? minuta.fecha_creacion.toDate() : new Date(minuta.fecha_creacion?.seconds * 1000 || minuta.fecha_creacion)
                                    const dateStr = dateObj instanceof Date && !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A';

                                    return (
                                        <tr key={minuta.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 font-medium text-gray-700">
                                                {minuta.sucursal}
                                            </td>
                                            <td className="p-4 text-gray-900 font-medium">
                                                {minuta.vendedor_nombre}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {dateStr}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold shadow-sm border border-blue-100">Ventas: {minuta.metas?.ventas || 0}</span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-bold shadow-sm border border-purple-100">Leads Convertidos y Cotizados: {minuta.metas?.leads || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 max-w-xs truncate text-xs">
                                                {minuta.comentarios_vendedor || <span className="text-gray-400 italic">Sin comentarios</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                {minuta.estado === 'Firmado' ? (
                                                    <div className="inline-flex items-center justify-center bg-emerald-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                                                        FIRMADO ✅
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center bg-amber-400 text-amber-900 rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                                                        PENDIENTE ⏳
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
