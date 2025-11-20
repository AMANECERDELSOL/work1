import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function WorkList({ user, onLogout }) {
    const [works, setWorks] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchWorks()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('works-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'works' },
                (payload) => {
                    console.log('Work changed:', payload)
                    fetchWorks() // Refetch when changes occur
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter])

    const fetchWorks = async () => {
        try {
            let query = supabase
                .from('works')
                .select('*')
                .eq('archived', false)

            // Apply filter
            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query
                .order('pinned', { ascending: false })  // Pinned first
                .order('created_at', { ascending: false })

            if (error) throw error
            setWorks(data || [])
        } catch (error) {
            console.error('Error fetching works:', error)
            alert('Error al cargar trabajos: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleTakeWork = async (workId) => {
        try {
            const { error } = await supabase
                .from('works')
                .update({
                    status: 'IN_PROGRESS',
                    locked_by: user.userId,
                    assigned_technician_id: user.userId,
                    locked_at: new Date().toISOString(),
                    started_at: new Date().toISOString()
                })
                .eq('id', workId)
                .in('status', ['PENDING', 'HIGH_PRIORITY', 'PAUSED'])

            if (error) throw error

            alert('✅ Trabajo tomado exitosamente')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handlePinWork = async (workId, currentPinned) => {
        try {
            const { error } = await supabase
                .from('works')
                .update({ pinned: !currentPinned })
                .eq('id', workId)

            if (error) throw error

            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handlePauseWork = async (workId) => {
        const reason = prompt('¿Por qué pausas el trabajo?')
        if (!reason) return

        try {
            const { error } = await supabase
                .from('works')
                .update({
                    status: 'PAUSED',
                    pause_reason: reason
                })
                .eq('id', workId)
                .eq('locked_by', user.userId)

            if (error) throw error

            alert('✅ Trabajo pausado')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handleCompleteWork = async (workId) => {
        if (!confirm('¿Marcar trabajo como finalizado?')) return

        try {
            const { error } = await supabase
                .from('works')
                .update({
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString()
                })
                .eq('id', workId)
                .eq('locked_by', user.userId)

            if (error) throw error

            alert('✅ Trabajo completado')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            'PENDING': 'badge-pending',
            'HIGH_PRIORITY': 'badge-priority',
            'IN_PROGRESS': 'badge-in-progress',
            'PAUSED': 'badge-paused',
            'COMPLETED': 'badge-completed'
        }
        return `badge ${badges[status] || 'badge-pending'}`
    }

    return (
        <div>
            <div className="navbar">
                <h1>☁️ Sky Web Panel</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works">Trabajos</Link>
                    <Link to="/calendar">Calendario</Link>
                    <Link to="/hazards">Peligros</Link>
                    <Link to="/chat">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <h2>📋 Gestión de Trabajos</h2>

                    <div style={{ marginTop: '15px' }}>
                        <label>Filtrar por estado:</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="HIGH_PRIORITY">Prioridad Alta</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="PAUSED">Pausados</option>
                            <option value="COMPLETED">Completados</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Cargando trabajos...</div>
                ) : works.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>No hay trabajos disponibles</p>
                    </div>
                ) : (
                    <div className="card">
                        {works.map(work => (
                            <div key={work.id} className="work-item" style={{
                                border: work.pinned ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                background: work.pinned ? '#eff6ff' : 'white'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <h3 style={{ marginBottom: '5px' }}>
                                        {work.pinned && <span style={{ marginRight: '8px' }}>📌</span>}
                                        {work.title}
                                    </h3>
                                    <span className={getStatusBadge(work.status)}>{work.status}</span>
                                    {work.priority && <span className="badge badge-priority">⚠️ PRIORIDAD</span>}
                                    {work.pinned && (
                                        <span className="badge" style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            marginLeft: '8px'
                                        }}>
                                            📌 FIJADO
                                        </span>
                                    )}
                                </div>

                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                                    {work.description}
                                </p>

                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                                    <div>📍 <strong>Dirección:</strong> {work.address}</div>
                                    <div>📅 <strong>Fecha:</strong> {new Date(work.work_date).toLocaleDateString('es-MX')}</div>
                                    <div>⏰ <strong>Turno:</strong> {work.shift || 'No especificado'}</div>
                                    {work.client_name && (
                                        <div>👤 <strong>Cliente:</strong> {work.client_name} - {work.client_phone}</div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {/* Pin/Unpin button - Solo para admins */}
                                    {user?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => handlePinWork(work.id, work.pinned)}
                                            className="btn btn-secondary"
                                            style={{
                                                background: work.pinned ? '#ef4444' : '#3b82f6',
                                                color: 'white'
                                            }}
                                        >
                                            {work.pinned ? '📌 Desfijar' : '📌 Fijar'}
                                        </button>
                                    )}

                                    {(work.status === 'PENDING' || work.status === 'HIGH_PRIORITY' || work.status === 'PAUSED') && (
                                        <button
                                            onClick={() => handleTakeWork(work.id)}
                                            className="btn btn-primary"
                                        >
                                            ✋ Tomar Trabajo
                                        </button>
                                    )}

                                    {work.status === 'IN_PROGRESS' && work.locked_by === user?.userId && (
                                        <>
                                            <button
                                                onClick={() => handleCompleteWork(work.id)}
                                                className="btn btn-success"
                                            >
                                                ✅ Finalizar
                                            </button>
                                            <button
                                                onClick={() => handlePauseWork(work.id)}
                                                className="btn btn-danger"
                                            >
                                                ⏸️ Pausar
                                            </button>
                                        </>
                                    )}

                                    {work.latitude && work.longitude && (
                                        <a
                                            href={`https://www.openstreetmap.org/directions?from=&to=${work.latitude},${work.longitude}&engine=fossgis_osrm_car`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                        >
                                            🗺️ Navegar
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default WorkList
