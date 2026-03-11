import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, updateDoc, where, orderBy } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle2, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';

export default function PortalVendedor() {
    const { currentUser, userData } = useAuth();

    const [misMinutas, setMisMinutas] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    // Form states per minuta are handled internally, but for simplicity here we manage a single active form
    const [comentarios, setComentarios] = useState('');
    const [acepto, setAcepto] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        // Escuchar solo las minutas del vendedor logueado
        const q = query(
            collection(db, 'minutas_semanales'),
            where('vendedor_uid', '==', currentUser.uid),
            orderBy('fecha_creacion', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMisMinutas(data);
        }, (err) => {
            // Fallback for missing index on orderBy
            const qFallback = query(
                collection(db, 'minutas_semanales'),
                where('vendedor_uid', '==', currentUser.uid)
            );
            onSnapshot(qFallback, (snapFallback) => {
                const dataFallback = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                dataFallback.sort((a, b) => b.fecha_creacion?.toMillis() - a.fecha_creacion?.toMillis());
                setMisMinutas(dataFallback);
            });
        });

        return () => unsub();
    }, [currentUser]);

    const handleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            setComentarios('');
            setAcepto(false);
        }
    };

    const handleFirmar = async (minutaId, nuevoEstado = 'Firmado') => {
        if (!comentarios.trim()) {
            alert('El comentario es obligatorio para continuar.');
            return;
        }

        setIsSigning(true);
        try {
            const docRef = doc(db, 'minutas_semanales', minutaId);
            await updateDoc(docRef, {
                estado: nuevoEstado,
                fecha_firma: new Date(),
                comentarios_vendedor: comentarios
            });
            alert(nuevoEstado === 'Firmado' ? 'Minuta firmada exitosamente. ¡Éxito en tus metas!' : 'Minuta rechazada. Deberás conversar con tu Jefatura.');
            setExpandedId(null);
        } catch (error) {
            console.error("Error updating document: ", error);
            alert('Hubo un error al procesar la minuta.');
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* SECTION: Vendedor Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                <UserCircle2 className="text-gray-400" size={32} />
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tu Perfil</label>
                    <div className="text-base font-medium text-gray-900">
                        {userData?.nombre || 'Vendedor'}
                    </div>
                    <div className="text-sm text-gray-500">
                        Sucursal {userData?.sucursal}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">Mis Minutas Asignadas</h2>

                <div className="space-y-4">
                    {misMinutas.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
                            No tienes minutas asignadas actualmente.
                        </div>
                    ) : (
                        misMinutas.map((minuta) => {
                            const isExpanded = expandedId === minuta.id;
                            const isFirmado = minuta.estado === 'Firmado';
                            const isRechazado = minuta.estado === 'Rechazado';
                            const dateObj = minuta.fecha_creacion?.toDate ? minuta.fecha_creacion.toDate() : new Date(minuta.fecha_creacion?.seconds * 1000 || minuta.fecha_creacion);

                            // Check 24h limit
                            const diffHours = (new Date() - dateObj) / (1000 * 60 * 60);
                            const isOver24h = diffHours > 24;

                            const dateStr = dateObj instanceof Date && !isNaN(dateObj)
                                ? `${dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} - ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
                                : 'Fecha desconocida';

                            return (
                                <div key={minuta.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${isFirmado ? 'border-emerald-200' : isRechazado ? 'border-red-200' : 'border-amber-200'}`}>
                                    {/* Header de la Tarjeta (Siempre visible) */}
                                    <div
                                        onClick={() => handleExpand(minuta.id)}
                                        className="p-4 cursor-pointer flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {isFirmado ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                        <CheckCircle size={12} /> FIRMADO
                                                    </span>
                                                ) : isRechazado ? (
                                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                        ❌ RECHAZADO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                        <Clock size={12} /> PENDIENTE
                                                    </span>
                                                )}
                                                {isOver24h && !isFirmado && !isRechazado && (
                                                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                                                        PLAZO VENCIDO (+24h)
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 capitalize">{dateStr}</h3>
                                        </div>
                                        <div className="text-gray-400">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Detalle Expandible */}
                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-gray-100 animate-fade-in mt-4">
                                            <div className="space-y-6">
                                                {/* Metas Grid */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tus Metas</h4>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Ventas', val: minuta.metas?.ventas },
                                                            { label: 'Créditos', val: minuta.metas?.creditos },
                                                            { label: 'Retoma Usado', val: minuta.metas?.penFin },
                                                            { label: 'Seguros', val: minuta.metas?.seguros },
                                                            { label: 'MPP', val: minuta.metas?.mpp },
                                                            { label: 'Leads Convertidos y Cotizados', val: minuta.metas?.leads },
                                                        ].map(meta => (
                                                            <div key={meta.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                                                                <p className="text-xs text-gray-500 mb-1">{meta.label}</p>
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {meta.val || 0}{meta.label.includes('%') ? '%' : ''}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Textos */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estrategias Accionables</h4>
                                                    <p className="text-sm text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100 whitespace-pre-wrap">
                                                        {minuta.estrategias}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proactividad</h4>
                                                    <p className="text-sm text-gray-700 bg-purple-50/50 p-3 rounded-md border border-purple-100 whitespace-pre-wrap">
                                                        {minuta.proactividad}
                                                    </p>
                                                </div>

                                                {/* Área de Toma de Conocimiento (Solo si no está firmado/rechazado) */}
                                                {(!isFirmado && !isRechazado) ? (
                                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-bold text-gray-800">Toma de Conocimiento</h4>
                                                            {isOver24h && (
                                                                <span className="text-[10px] text-red-500 font-bold uppercase">Acción restringida (pasaron 24h)</span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Comentarios o solicitud de apoyo <span className="text-red-500">(Obligatorio)</span></label>
                                                            <textarea
                                                                disabled={isOver24h}
                                                                value={comentarios}
                                                                onChange={e => setComentarios(e.target.value)}
                                                                rows={2}
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                placeholder="Escribe tu compromiso o motivo de rechazo..."
                                                            />
                                                        </div>

                                                        <label className={`flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-colors ${isOver24h ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                                                            <input
                                                                disabled={isOver24h}
                                                                type="checkbox"
                                                                checked={acepto}
                                                                onChange={e => setAcepto(e.target.checked)}
                                                                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                                                            />
                                                            <span className="text-sm text-gray-700 font-medium leading-tight">
                                                                He leído, entiendo mis metas y me comprometo a ejecutar las estrategias detalladas.
                                                            </span>
                                                        </label>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => handleFirmar(minuta.id, 'Firmado')}
                                                                disabled={!acepto || isSigning || isOver24h || !comentarios.trim()}
                                                                className={`py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${acepto && !isSigning && !isOver24h && comentarios.trim()
                                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {isSigning ? 'Guardando...' : 'Confirmar y Firmar'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleFirmar(minuta.id, 'Rechazado')}
                                                                disabled={isSigning || isOver24h || !comentarios.trim()}
                                                                className={`py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${!isSigning && !isOver24h && comentarios.trim()
                                                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>

                                                        {isOver24h && (
                                                            <p className="text-[11px] text-center text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                                                                ⚠️ Han pasado más de 24 horas. Para cualquier modificación, contacta a tu Jefe de Ventas o Supervisor.
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`p-4 rounded-xl border mt-6 ${isFirmado ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                                        <p className={`text-sm font-medium ${isFirmado ? 'text-emerald-800' : 'text-red-800'}`}>
                                                            {isFirmado ? `✅ Minuta firmada el ${minuta.fecha_firma?.toDate ? minuta.fecha_firma.toDate().toLocaleString('es-ES') : new Date(minuta.fecha_firma?.seconds * 1000 || minuta.fecha_firma).toLocaleString('es-ES')}.`
                                                                : `❌ Minuta rechazada el ${minuta.fecha_firma?.toDate ? minuta.fecha_firma.toDate().toLocaleString('es-ES') : new Date(minuta.fecha_firma?.seconds * 1000 || minuta.fecha_firma).toLocaleString('es-ES')}.`}
                                                        </p>
                                                        {minuta.comentarios_vendedor && (
                                                            <div className={`mt-3 bg-white p-3 rounded-lg border shadow-sm ${isFirmado ? 'border-emerald-200' : 'border-red-200'}`}>
                                                                <span className={`font-bold text-xs uppercase mb-1 block ${isFirmado ? 'text-emerald-800' : 'text-red-800'}`}>Tus comentarios:</span>
                                                                <p className="text-sm text-gray-700">
                                                                    {minuta.comentarios_vendedor}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
