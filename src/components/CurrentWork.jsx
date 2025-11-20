import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function CurrentWork({ user, onWorkComplete }) {
    const [currentWork, setCurrentWork] = useState(null)
    const [loading, setLoading] = useState(true)
    const [availablePartners, setAvailablePartners] = useState([])
    const [selectedPartner, setSelectedPartner] = useState('')

    useEffect(() => {
        fetchCurrentWork()
        fetchAvailablePartners()

        // Realtime subscription for work updates
        const subscription = supabase
            .channel('current-work')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'works',
                filter: `assigned_technician_id=eq.${user.userId}`
            }, () => fetchCurrentWork())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'works',
                filter: `partner_technician_id=eq.${user.userId}`
            }, () => fetchCurrentWork())
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [user.userId])

    const fetchCurrentWork = async () => {
        try {
            const { data, error } = await supabase
                .from('works')
                .select(`
                    *,
                    partner:partner_technician_id (
                        id, full_name, username
                    )
                `)
                .or(`assigned_technician_id.eq.${user.userId},partner_technician_id.eq.${user.userId}`)
                .eq('status', 'IN_PROGRESS')
                .single()

            if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows found"
            setCurrentWork(data)
        } catch (error) {
            console.error('Error fetching current work:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailablePartners = async () => {
        try {
            // Fetch active technicians who are not the current user
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, username')
                .eq('role', 'TECHNICIAN')
                .eq('is_active', true)
                .neq('id', user.userId)

            if (error) throw error
            setAvailablePartners(data || [])
        } catch (error) {
            console.error('Error fetching partners:', error)
        }
    }

    const handleRequestWork = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .rpc('assign_next_work', { tech_id: user.userId })

            if (error) throw error

            if (data) {
                setCurrentWork(data)
                alert('✅ ¡Nuevo trabajo asignado!')
            } else {
                alert('ℹ️ No hay trabajos pendientes en este momento.')
            }
        } catch (error) {
            alert('❌ Error al solicitar trabajo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddPartner = async () => {
        if (!selectedPartner || !currentWork) return

        try {
            const { error } = await supabase
                .from('works')
                .update({ partner_technician_id: selectedPartner })
                .eq('id', currentWork.id)

            if (error) throw error
            alert('✅ Compañero añadido al trabajo')
            fetchCurrentWork()
        } catch (error) {
            alert('❌ Error al añadir compañero: ' + error.message)
        }
    }

    const handleCompleteWork = async () => {
        if (!confirm('¿Estás seguro de que terminaste este trabajo?')) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .rpc('complete_and_get_next', {
                    work_id: currentWork.id,
                    tech_id: user.userId
                })

            if (error) throw error

            alert('🎉 ¡Trabajo completado!')

            if (data) {
                setCurrentWork(data)
                alert('✅ ¡Siguiente trabajo asignado automáticamente!')
            } else {
                setCurrentWork(null)
            }

            if (onWorkComplete) onWorkComplete()
        } catch (error) {
            alert('❌ Error al completar trabajo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="loading">Cargando tu estado...</div>

    if (!currentWork) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☕</div>
                <h2>Estás disponible</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                    No tienes ningún trabajo asignado actualmente.
                </p>
                <button
                    onClick={handleRequestWork}
                    className="btn btn-primary"
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                >
                    🚀 Solicitar Siguiente Trabajo
                </button>
            </div>
        )
    }

    return (
        <div className="card animate-slide-up" style={{ borderLeft: '5px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div>
                    <span className="badge badge-in-progress" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                        En Progreso
                    </span>
                    <h2 style={{ margin: '0.5rem 0', fontSize: '1.8rem' }}>{currentWork.title}</h2>
                    <div style={{ fontSize: '1.1rem', color: '#475569' }}>
                        📍 {currentWork.address}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Inicio</div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                        {new Date(currentWork.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b' }}>Descripción</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{currentWork.description}</p>

                {currentWork.client_name && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <strong>Cliente:</strong> {currentWork.client_name}
                        {currentWork.client_phone && <span style={{ marginLeft: '1rem' }}>📞 {currentWork.client_phone}</span>}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'end' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', color: '#64748b' }}>Compañero de Equipo</h3>
                    {currentWork.partner ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#2563eb', fontWeight: '600' }}>
                            👤 Trabajando con: {currentWork.partner.full_name || currentWork.partner.username}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={selectedPartner}
                                onChange={(e) => setSelectedPartner(e.target.value)}
                                style={{ padding: '0.5rem' }}
                            >
                                <option value="">Seleccionar compañero...</option>
                                {availablePartners.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
                                ))}
                            </select>
                            <button onClick={handleAddPartner} className="btn btn-secondary" disabled={!selectedPartner}>
                                + Añadir
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'right' }}>
                    <button
                        onClick={handleCompleteWork}
                        className="btn btn-success"
                        style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                    >
                        ✅ Terminar Trabajo
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CurrentWork
