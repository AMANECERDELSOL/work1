import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLocationWithAddress } from '../utils/geolocation'

function HazardReports({ user, onLogout }) {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [gettingLocation, setGettingLocation] = useState(false)

    const [formData, setFormData] = useState({
        description: '',
        severity: 'MEDIUM',
        location_address: '',
        latitude: null,
        longitude: null
    })

    useEffect(() => {
        fetchReports()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('hazard-reports-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'hazard_reports' },
                () => fetchReports()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('hazard_reports')
                .select(`
                    *,
                    reporter:reported_by(username, full_name),
                    resolver:resolved_by(username, full_name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setReports(data || [])
        } catch (error) {
            console.error('Error fetching hazard reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGetLocation = async () => {
        setGettingLocation(true)
        try {
            const location = await getLocationWithAddress()
            setFormData(prev => ({
                ...prev,
                location_address: location.address,
                latitude: location.latitude,
                longitude: location.longitude
            }))
            alert('✅ Ubicación obtenida correctamente')
        } catch (error) {
            alert('❌ ' + error.message)
        } finally {
            setGettingLocation(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.description.trim()) {
            alert('Por favor describe el peligro')
            return
        }

        try {
            const { error } = await supabase
                .from('hazard_reports')
                .insert([{
                    reported_by: user.userId,
                    description: formData.description,
                    severity: formData.severity,
                    location_address: formData.location_address || null,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }])

            if (error) throw error

            alert('✅ Reporte creado exitosamente')
            setFormData({
                description: '',
                severity: 'MEDIUM',
                location_address: '',
                latitude: null,
                longitude: null
            })
            setShowForm(false)
            fetchReports()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handleResolve = async (reportId) => {
        if (!confirm('¿Marcar este reporte como resuelto?')) return

        try {
            const { error } = await supabase
                .from('hazard_reports')
                .update({
                    resolved: true,
                    resolved_by: user.userId,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', reportId)

            if (error) throw error

            alert('✅ Reporte marcado como resuelto')
            fetchReports()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const getSeverityBadge = (severity) => {
        const badges = {
            'LOW': { class: 'badge-completed', label: '🟢 BAJO' },
            'MEDIUM': { class: 'badge-pending', label: '🟡 MEDIO' },
            'HIGH': { class: 'badge-priority', label: '🟠 ALTO' },
            'CRITICAL': { class: 'badge-danger', label: '🔴 CRÍTICO' }
        }
        const badge = badges[severity] || badges['MEDIUM']
        return <span className={`badge ${badge.class}`}>{badge.label}</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>⚠️ Reportes de Peligros</h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="btn btn-primary"
                        >
                            {showForm ? 'Cancelar' : '+ Nuevo Reporte'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="card">
                        <h3>Crear Reporte de Peligro</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Descripción del Peligro *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe detalladamente el peligro encontrado..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Severidad *</label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                    required
                                >
                                    <option value="LOW">🟢 Bajo</option>
                                    <option value="MEDIUM">🟡 Medio</option>
                                    <option value="HIGH">🟠 Alto</option>
                                    <option value="CRITICAL">🔴 Crítico</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Ubicación</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={formData.location_address}
                                        onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                                        placeholder="Dirección o descripción del lugar"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        className="btn btn-secondary"
                                        disabled={gettingLocation}
                                    >
                                        {gettingLocation ? '📍 Obteniendo...' : '📍 Usar mi ubicación'}
                                    </button>
                                </div>
                                {formData.latitude && (
                                    <small style={{ color: '#666' }}>
                                        Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                    </small>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary">
                                    Crear Reporte
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="loading">Cargando reportes...</div>
                ) : reports.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>
                            No hay reportes de peligros
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        {reports.map(report => (
                            <div key={report.id} className="work-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                    <div>
                                        {getSeverityBadge(report.severity)}
                                        {report.resolved && (
                                            <span className="badge badge-completed" style={{ marginLeft: '8px' }}>
                                                ✅ RESUELTO
                                            </span>
                                        )}
                                    </div>
                                    <small style={{ color: '#999' }}>
                                        {new Date(report.created_at).toLocaleDateString('es-MX')}
                                    </small>
                                </div>

                                <p style={{ margin: '10px 0', lineHeight: '1.5' }}>
                                    {report.description}
                                </p>

                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                                    {report.location_address && (
                                        <div>📍 {report.location_address}</div>
                                    )}
                                    <div>
                                        👤 Reportado por: <strong>{report.reporter?.full_name || report.reporter?.username || 'Usuario'}</strong>
                                    </div>
                                    {report.resolved && report.resolver && (
                                        <div>
                                            ✅ Resuelto por: <strong>{report.resolver?.full_name || report.resolver?.username}</strong>
                                            {' '} el {new Date(report.resolved_at).toLocaleDateString('es-MX')}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!report.resolved && user.role === 'ADMIN' && (
                                        <button
                                            onClick={() => handleResolve(report.id)}
                                            className="btn btn-success"
                                        >
                                            Marcar como Resuelto
                                        </button>
                                    )}
                                    {report.latitude && report.longitude && (
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}&zoom=15`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                        >
                                            🗺️ Ver en Mapa
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

export default HazardReports
