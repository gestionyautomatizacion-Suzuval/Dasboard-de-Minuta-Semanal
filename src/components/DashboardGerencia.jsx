import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Clock, CheckCircle, Users } from 'lucide-react';

export default function DashboardGerencia() {
    const { currentUser, userData } = useAuth();

    const [vendedores, setVendedores] = useState([]);
    const [selectedVendedorId, setSelectedVendedorId] = useState('');

    // Form state
    const [ventas, setVentas] = useState('');
    const [creditos, setCreditos] = useState('');
    const [penFin, setPenFin] = useState('');
    const [seguros, setSeguros] = useState('');
    const [mpp, setMpp] = useState('');
    const [leads, setLeads] = useState('');
    const [estrategias, setEstrategias] = useState('');
    const [proactividad, setProactividad] = useState('');
    const [creating, setCreating] = useState(false);

    const [minutas, setMinutas] = useState([]);
    const [filter, setFilter] = useState('Todos');
    const [filterVendedor, setFilterVendedor] = useState('Todos');

    // State for rejection flow
    const [isRejecting, setIsRejecting] = useState(null); // id of the minuta
    const [rejectionReason, setRejectionReason] = useState('');

    // Fetch Vendedores: Supervisor gets all, Jefe de Venta gets their sucursal only
    useEffect(() => {
        if (!userData) return;
        const isGlobal = userData.rol === 'Supervisor';
        if (!isGlobal && !userData.sucursal) return;

        const q = isGlobal
            ? query(collection(db, 'usuarios'), where('rol', '==', 'Vendedor'))
            : query(collection(db, 'usuarios'), where('sucursal', '==', userData.sucursal), where('rol', '==', 'Vendedor'));

        const unsub = onSnapshot(q, (snapshot) => {
            const vends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVendedores(vends);
            if (vends.length > 0 && !selectedVendedorId) {
                setSelectedVendedorId(vends[0].id);
            }
        });
        return () => unsub();
    }, [userData?.sucursal, userData?.rol]);

    // Fetch Minutas: Supervisor gets all globally, Jefe de Venta gets their sucursal only
    useEffect(() => {
        if (!userData) return;
        const isGlobal = userData.rol === 'Supervisor';
        if (!isGlobal && !userData.sucursal) return;

        const buildQuery = () => isGlobal
            ? query(collection(db, 'minutas_semanales'), orderBy('fecha_creacion', 'desc'))
            : query(collection(db, 'minutas_semanales'), where('sucursal', '==', userData.sucursal), orderBy('fecha_creacion', 'desc'));

        const unsub = onSnapshot(buildQuery(), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMinutas(data);
        }, (err) => {
            console.error("Index required or error fetching:", err);
            const qFallback = isGlobal
                ? collection(db, 'minutas_semanales')
                : query(collection(db, 'minutas_semanales'), where('sucursal', '==', userData.sucursal));
            onSnapshot(qFallback, (snapFallback) => {
                const dataFallback = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                dataFallback.sort((a, b) => b.fecha_creacion?.toMillis() - a.fecha_creacion?.toMillis());
                setMinutas(dataFallback);
            });
        });

        return () => unsub();
    }, [userData?.sucursal, userData?.rol]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVendedorId || !ventas || !estrategias) {
            alert("Por favor completa los campos principales.");
            return;
        }

        const selectedVend = vendedores.find(v => v.id === selectedVendedorId);
        setCreating(true);

        try {
            await addDoc(collection(db, 'minutas_semanales'), {
                vendedor_uid: selectedVendedorId,
                vendedor_nombre: selectedVend.nombre,
                sucursal: userData.sucursal,
                creador_uid: currentUser.uid,
                fecha_creacion: serverTimestamp(),
                metas: {
                    ventas: Number(ventas),
                    creditos: Number(creditos),
                    penFin: Number(penFin),
                    seguros: Number(seguros),
                    mpp: Number(mpp),
                    leads: Number(leads)
                },
                estrategias,
                proactividad,
                estado: 'Pendiente',
                comentarios_vendedor: ''
            });

            // Reset form
            setVentas(''); setCreditos(''); setPenFin(''); setSeguros('');
            setMpp(''); setLeads(''); setEstrategias(''); setProactividad('');
            alert("Compromiso creado exitosamente!");
        } catch (error) {
            console.error("Error creating document: ", error);
            alert("Hubo un error al guardar la minuta.");
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateEstado = async (id, nuevoEstado, comment = '') => {
        try {
            const updateData = {
                estado: nuevoEstado,
                fecha_firma: serverTimestamp()
            };

            if (nuevoEstado === 'Rechazado' && comment) {
                updateData.comentarios_vendedor = `[Rechazo Jefatura]: ${comment}`;
            }

            await updateDoc(doc(db, 'minutas_semanales', id), updateData);

            setIsRejecting(null);
            setRejectionReason('');
            alert(`Estado actualizado a ${nuevoEstado}`);
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("No se pudo actualizar el estado.");
        }
    };

    const filteredMinutas = minutas.filter(m => {
        const matchesStatus = filter === 'Todos' || m.estado === filter;
        const matchesVendedor = filterVendedor === 'Todos' || m.vendedor_uid === filterVendedor;
        return matchesStatus && matchesVendedor;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${userData?.rol === 'Supervisor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {userData?.rol === 'Supervisor' ? 'Panel Supervisor' : 'Panel Jefatura'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {userData?.rol === 'Supervisor'
                                ? <span className="flex items-center gap-1 text-purple-600 font-semibold">🌐 Acceso Global — Todas las Sucursales</span>
                                : `Sucursal ${userData?.sucursal}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION: Formulario de Creación */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <PlusCircle className="text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Nueva Minuta de Compromiso</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
                            {vendedores.length === 0 ? (
                                <p className="text-sm border border-orange-200 bg-orange-50 text-orange-700 px-3 py-2 rounded-md">
                                    No hay vendedores registrados en esta sucursal.
                                </p>
                            ) : (
                                <select
                                    value={selectedVendedorId}
                                    onChange={e => setSelectedVendedorId(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                >
                                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Metas de la Semana</h3>
                        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { label: 'Ventas', val: ventas, setter: setVentas },
                                { label: 'Créditos', val: creditos, setter: setCreditos },
                                { label: 'Retoma Usado', val: penFin, setter: setPenFin },
                                { label: 'Seguros', val: seguros, setter: setSeguros },
                                { label: 'MPP', val: mpp, setter: setMpp },
                                { label: 'Leads Convertidos y Cotizados', val: leads, setter: setLeads },
                            ].map((field) => (
                                <div key={field.label}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                                    <input
                                        type="number"
                                        required={field.label === 'Ventas'}
                                        value={field.val}
                                        onChange={e => field.setter(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estrategias accionables</label>
                            <textarea
                                required
                                value={estrategias}
                                onChange={e => setEstrategias(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="¿Qué acciones específicas tomará?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Proactividad</label>
                            <textarea
                                value={proactividad}
                                onChange={e => setProactividad(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Acciones extra, búsqueda de referidos, etc."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={creating || vendedores.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            {creating ? 'Guardando...' : 'Generar y Asignar Compromiso'}
                        </button>
                    </div>
                </form>
            </section>

            {/* SECTION: Tablero de Seguimiento (Estilo Monday) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">Tablero de Seguimiento</h2>

                    <div className="flex flex-wrap items-center gap-4 self-start">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilter('Todos')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filter === 'Todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilter('Pendiente')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${filter === 'Pendiente' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-amber-700'}`}
                            >
                                <Clock size={14} /> Pendientes
                            </button>
                            <button
                                onClick={() => setFilter('Firmado')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${filter === 'Firmado' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-emerald-700'}`}
                            >
                                <CheckCircle size={14} /> Firmados
                            </button>
                        </div>

                        {/* Salesperson Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Vendedor:</label>
                            <select
                                value={filterVendedor}
                                onChange={e => setFilterVendedor(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="Todos">Todos los Vendedores</option>
                                {vendedores.map(v => (
                                    <option key={v.id} value={v.id}>{v.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
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
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No hay minutas para mostrar en esta vista.
                                    </td>
                                </tr>
                            ) : (
                                filteredMinutas.map((minuta) => {
                                    const dateObj = minuta.fecha_creacion?.toDate ? minuta.fecha_creacion.toDate() : new Date(minuta.fecha_creacion?.seconds * 1000 || minuta.fecha_creacion)
                                    const dateStr = dateObj instanceof Date && !isNaN(dateObj)
                                        ? `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')} / ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
                                        : 'N/A';

                                    return (
                                        <tr key={minuta.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 text-gray-900 font-medium">
                                                {minuta.vendedor_nombre}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {dateStr}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold shadow-sm border border-blue-100" title="Ventas">
                                                        Ventas: {minuta.metas?.ventas || 0}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold shadow-sm border border-emerald-100" title="Créditos">
                                                        Créditos: {minuta.metas?.creditos || 0}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs font-bold shadow-sm border border-orange-100" title="Retoma Usado">
                                                        Retoma Usado: {minuta.metas?.penFin || 0}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-pink-50 text-pink-700 text-xs font-bold shadow-sm border border-pink-100" title="Seguros">
                                                        Seguros: {minuta.metas?.seguros || 0}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold shadow-sm border border-indigo-100" title="MPP">
                                                        MPP: {minuta.metas?.mpp || 0}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-bold shadow-sm border border-purple-100" title="Leads Convertidos y Cotizados">
                                                        Leads Convertidos y Cotizados: {minuta.metas?.leads || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 max-w-xs truncate text-xs">
                                                {minuta.comentarios_vendedor || <span className="text-gray-400 italic">Sin comentarios</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {minuta.estado === 'Firmado' ? (
                                                        <div className="inline-flex items-center justify-center bg-emerald-500 text-white rounded-full px-3 py-1 text-[10px] font-bold shadow-sm">
                                                            FIRMADO ✅
                                                        </div>
                                                    ) : minuta.estado === 'Rechazado' ? (
                                                        <div className="inline-flex items-center justify-center bg-red-500 text-white rounded-full px-3 py-1 text-[10px] font-bold shadow-sm">
                                                            RECHAZADO ❌
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center justify-center bg-amber-400 text-amber-900 rounded-full px-3 py-1 text-[10px] font-bold shadow-sm">
                                                            PENDIENTE ⏳
                                                        </div>
                                                    )}

                                                    {/* Cambio de estado para Jefatura */}
                                                    {userData?.rol === 'Jefe de Venta' ? (
                                                        minuta.estado === 'Pendiente' && (
                                                            <div className="mt-2 w-full">
                                                                {isRejecting === minuta.id ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <textarea
                                                                            value={rejectionReason}
                                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                                            placeholder="Motivo del rechazo..."
                                                                            className="text-[10px] p-1 border border-red-200 rounded w-full outline-none focus:border-red-400"
                                                                            rows={2}
                                                                        />
                                                                        <div className="flex gap-1 justify-center">
                                                                            <button
                                                                                onClick={() => handleUpdateEstado(minuta.id, 'Rechazado', rejectionReason)}
                                                                                disabled={!rejectionReason.trim()}
                                                                                className="bg-red-500 text-white text-[9px] px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                                                                            >
                                                                                Confirmar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setIsRejecting(null); setRejectionReason(''); }}
                                                                                className="bg-gray-100 text-gray-700 text-[9px] px-2 py-1 rounded hover:bg-gray-200"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setIsRejecting(minuta.id)}
                                                                        className="text-[10px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-600 px-2 py-1 rounded transition-all w-full flex items-center justify-center gap-1"
                                                                    >
                                                                        ❌ Rechazar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    ) : (
                                                        <select
                                                            className="text-[9px] border border-gray-200 rounded p-1 bg-white outline-none hover:border-blue-400 transition-colors"
                                                            value={minuta.estado}
                                                            onChange={(e) => handleUpdateEstado(minuta.id, e.target.value)}
                                                        >
                                                            <option value="Pendiente">Pendiente</option>
                                                            <option value="Firmado">Firmado</option>
                                                            <option value="Rechazado">Rechazado</option>
                                                        </select>
                                                    )}
                                                </div>
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
