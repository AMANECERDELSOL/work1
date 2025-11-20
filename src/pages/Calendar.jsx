import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Calendar({ user, onLogout }) {
    const [works, setWorks] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [newWork, setNewWork] = useState({
        title: '',
        description: '',
        address: '',
        work_date: new Date().toISOString().split('T')[0],
        shift: 'MORNING',
        priority: false,
        client_name: '',
        client_phone: ''
    })

    useEffect(() => {
        fetchWorks()
    }, [currentDate])

    const fetchWorks = async () => {
        try {
            // Get first and last day of current month
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

            const { data, error } = await supabase
                .from('works')
                .select('*')
                .eq('archived', false)
                .gte('work_date', firstDay.toISOString().split('T')[0])
                .lte('work_date', lastDay.toISOString().split('T')[0])
                .order('work_date', { ascending: true })

            if (error) throw error
            setWorks(data || [])
        } catch (error) {
            console.error('Error fetching works:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddWork = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('works')
                .insert([{
                    ...newWork,
                    created_by: user.userId,
                    status: newWork.priority ? 'HIGH_PRIORITY' : 'PENDING'
                }])

            if (error) throw error

            alert('✅ Trabajo creado exitosamente')
            setShowModal(false)
            setNewWork({
                title: '',
                description: '',
                address: '',
                work_date: new Date().toISOString().split('T')[0],
                shift: 'MORNING',
                priority: false,
                client_name: '',
                client_phone: ''
            })
            fetchWorks()
        } catch (error) {
            alert('❌ Error al crear trabajo: ' + error.message)
        }
    }

    const openNewWorkModal = (date = null) => {
        if (date) {
            setNewWork(prev => ({
                ...prev,
                work_date: date.toISOString().split('T')[0]
            }))
        }
        setShowModal(true)
    }

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Add empty days for alignment
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    const getWorksForDate = (date) => {
        if (!date) return []
        const dateStr = date.toISOString().split('T')[0]
        return works.filter(work => work.work_date === dateStr)
    }

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#fbbf24',
            'HIGH_PRIORITY': '#ef4444',
            'IN_PROGRESS': '#3b82f6',
            'PAUSED': '#f97316',
            'COMPLETED': '#10b981'
        }
        return colors[status] || '#9ca3af'
    }

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
        setSelectedDate(null)
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    const days = getDaysInMonth()

    return (
        <div>
            <div className="navbar">
                <h1>☁️ Sky Web Panel</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works">Trabajos</Link>
                    <Link to="/calendar" className="active">Calendario</Link>
                    <Link to="/hazards">Peligros</Link>
                    {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
                    <Link to="/chat">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => changeMonth(-1)} className="btn btn-secondary">←</button>
                            <h2 style={{ margin: 0 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                            <button onClick={() => changeMonth(1)} className="btn btn-secondary">→</button>
                        </div>
                        <button onClick={() => openNewWorkModal()} className="btn btn-primary">
                            + Nuevo Trabajo
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">Cargando calendario...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                            {/* Day names header */}
                            {dayNames.map(name => (
                                <div key={name} style={{
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    padding: '10px',
                                    color: '#64748b',
                                    fontSize: '0.875rem'
                                }}>
                                    {name}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {days.map((date, index) => {
                                if (!date) {
                                    return <div key={`empty-${index}`} />
                                }

                                const dayWorks = getWorksForDate(date)
                                const isToday = date.toDateString() === new Date().toDateString()
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

                                return (
                                    <div
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        style={{
                                            border: isToday ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                            background: isSelected ? '#eff6ff' : 'white',
                                            borderRadius: '0.75rem',
                                            padding: '0.75rem',
                                            minHeight: '100px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                        className="calendar-day"
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '5px',
                                            fontSize: '0.875rem',
                                            fontWeight: isToday ? 'bold' : 'normal',
                                            color: isToday ? '#2563eb' : '#1e293b'
                                        }}>
                                            <span>{date.getDate()}</span>
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openNewWorkModal(date)
                                                }}
                                                className="add-btn"
                                                style={{
                                                    opacity: 0,
                                                    color: '#64748b',
                                                    fontSize: '1.2rem',
                                                    lineHeight: '1rem'
                                                }}
                                                title="Agregar trabajo este día"
                                            >
                                                +
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {dayWorks.slice(0, 3).map(work => (
                                                <div
                                                    key={work.id}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: getStatusColor(work.status),
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontWeight: '500'
                                                    }}
                                                    title={work.title}
                                                >
                                                    {work.title}
                                                </div>
                                            ))}
                                            {dayWorks.length > 3 && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                                                    +{dayWorks.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Selected date details */}
                {selectedDate && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Trabajos del {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                            <button
                                onClick={() => openNewWorkModal(selectedDate)}
                                className="btn btn-secondary"
                            >
                                + Agregar aquí
                            </button>
                        </div>

                        {getWorksForDate(selectedDate).length === 0 ? (
                            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                                No hay trabajos programados para este día
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {getWorksForDate(selectedDate).map(work => (
                                    <div key={work.id} className="work-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>
                                                    {work.pinned && '📌 '}
                                                    {work.title}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span className={`badge badge-${work.status.toLowerCase().replace('_', '-')}`}>
                                                        {work.status}
                                                    </span>
                                                    {work.priority && <span className="badge badge-priority">⚠️ PRIORIDAD</span>}
                                                </div>
                                            </div>
                                            <div className="text-muted text-sm">
                                                {work.shift === 'MORNING' ? '🌅 Mañana' : '🌆 Tarde'}
                                            </div>
                                        </div>
                                        <p style={{ color: '#475569', fontSize: '0.875rem', margin: '0.75rem 0' }}>{work.description}</p>
                                        <div className="text-sm text-muted">
                                            <div>📍 {work.address}</div>
                                            {work.client_name && <div>👤 {work.client_name}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Minimalist Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Nuevo Trabajo</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddWork}>
                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    value={newWork.title}
                                    onChange={e => setNewWork({ ...newWork, title: e.target.value })}
                                    required
                                    placeholder="Ej. Instalación de fibra óptica"
                                />
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={newWork.description}
                                    onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                                    rows="3"
                                    placeholder="Detalles del trabajo..."
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={newWork.work_date}
                                        onChange={e => setNewWork({ ...newWork, work_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Turno</label>
                                    <select
                                        value={newWork.shift}
                                        onChange={e => setNewWork({ ...newWork, shift: e.target.value })}
                                    >
                                        <option value="MORNING">🌅 Mañana</option>
                                        <option value="AFTERNOON">🌆 Tarde</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    value={newWork.address}
                                    onChange={e => setNewWork({ ...newWork, address: e.target.value })}
                                    required
                                    placeholder="Calle, Número, Colonia..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Cliente (Opcional)</label>
                                <input
                                    type="text"
                                    value={newWork.client_name}
                                    onChange={e => setNewWork({ ...newWork, client_name: e.target.value })}
                                    placeholder="Nombre del cliente"
                                />
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="priority"
                                    checked={newWork.priority}
                                    onChange={e => setNewWork({ ...newWork, priority: e.target.checked })}
                                    style={{ width: 'auto' }}
                                />
                                <label htmlFor="priority" style={{ margin: 0, color: '#dc2626' }}>Marcar como Prioridad Alta</label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Crear Trabajo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Calendar
