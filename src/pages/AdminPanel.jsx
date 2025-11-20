import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminPanel({ user, onLogout }) {
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTechnicians()
    }, [])

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'TECHNICIAN')
                .order('full_name', { ascending: true })

            if (error) throw error
            setTechnicians(data || [])
        } catch (error) {
            console.error('Error fetching technicians:', error)
            alert('Error al cargar técnicos')
        } finally {
            setLoading(false)
        }
    }

    const toggleTechnicianStatus = async (techId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', techId)

            if (error) throw error

            // Actualizar lista localmente
            setTechnicians(technicians.map(tech =>
                tech.id === techId ? { ...tech, is_active: !currentStatus } : tech
            ))

            alert(`✅ Técnico ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
        } catch (error) {
            console.error('Error updating status:', error)
            alert('❌ Error al actualizar estado: ' + error.message)
        }
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
                    <Link to="/admin" className="active">Admin</Link>
                    <Link to="/chat">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <h2>👥 Gestión de Técnicos</h2>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                        Administra el acceso y estado de los técnicos de campo.
                    </p>
                </div>

                {loading ? (
                    <div className="loading">Cargando técnicos...</div>
                ) : (
                    <div className="card">
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>Especialidades</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.map(tech => (
                                        <tr key={tech.id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{tech.full_name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{tech.email}</div>
                                            </td>
                                            <td>@{tech.username}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {tech.specialties?.map((spec, idx) => (
                                                        <span key={idx} className="badge badge-pending" style={{ fontSize: '10px' }}>
                                                            {spec}
                                                        </span>
                                                    )) || <span style={{ color: '#999' }}>-</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${tech.is_active ? 'badge-completed' : 'badge-danger'}`}>
                                                    {tech.is_active ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleTechnicianStatus(tech.id, tech.is_active)}
                                                    className={`btn ${tech.is_active ? 'btn-danger' : 'btn-success'}`}
                                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                                >
                                                    {tech.is_active ? '🚫 Desactivar' : '✅ Activar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {technicians.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                No se encontraron técnicos registrados.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminPanel
