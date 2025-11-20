import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function TechMonitor({ user, onLogout }) {
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTechnicianStatus()

        // Subscribe to realtime updates
        const subscription = supabase
            .channel('tech-monitor')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'works' }, () => {
                fetchTechnicianStatus()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                fetchTechnicianStatus()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const fetchTechnicianStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('technician_status_view')
                .select('*')
                .order('full_name')

            if (error) throw error
            setTechnicians(data || [])
        } catch (error) {
            console.error('Error fetching tech status:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (tech) => {
        if (!tech.is_active) return <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>Desconectado</span>
        if (tech.current_work_id) return <span className="badge" style={{ background: '#dbeafe', color: '#2563eb' }}>Trabajando</span>
        return <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Disponible</span>
    }

    return (
        <div>
            <div className="navbar">
                <h1>☁️ Sky Web Panel</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works">Trabajos</Link>
                    <Link to="/calendar">Calendario</Link>
                    <Link to="/monitor" className="active">Monitor</Link>
                    <Link to="/admin">Admin</Link>
                    <button onClick={onLogout} className="btn btn-secondary">Salir</button>
                </nav>
            </div>

            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Monitoreo de Técnicos en Tiempo Real</h2>
                    <div className="badge" style={{ background: '#d1fae5', color: '#059669' }}>
                        ● En vivo
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Cargando estado de la flota...</div>
                ) : (
                    <div className="monitor-grid">
                        {technicians.map(tech => (
                            <div
                                key={tech.technician_id}
                                className={`card tech-card ${!tech.is_active ? 'status-inactive' : tech.current_work_id ? 'status-working' : 'status-active'}`}
                                style={{ padding: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0' }}>{tech.full_name || tech.username}</h3>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            ID: #{tech.technician_id.toString().padStart(4, '0')}
                                        </div>
                                    </div>
                                    {getStatusBadge(tech)}
                                </div>

                                {tech.current_work_id ? (
                                    <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem' }}>
                                            Trabajo Actual
                                        </div>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {tech.current_work_title}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                                            📍 {tech.current_work_address}
                                        </div>

                                        {tech.partner_name && (
                                            <div style={{ fontSize: '0.875rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                👥 Con: <strong>{tech.partner_name}</strong>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                            Iniciado: {new Date(tech.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                        Sin asignación activa
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TechMonitor
