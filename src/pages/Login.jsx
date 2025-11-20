import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Login usando username y password con función RPC en Supabase
            const { data, error: loginError } = await supabase.rpc('login_with_username', {
                p_username: username,
                p_password: password
            })

            if (loginError) {
                throw loginError
            }

            if (!data || !data.success) {
                setError(data?.error || 'Credenciales inválidas')
                setLoading(false)
                return
            }

            // Guardar user data en localStorage
            const userData = {
                userId: data.user_id,
                username: data.username,
                role: data.role,
                fullName: data.full_name
            }

            onLogin(data.session_token, userData)
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message || 'Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>☁️ Sky Web Panel</h2>
                    <p className="text-muted">Ingresa tus credenciales para continuar</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ej. admin"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                        Credenciales de prueba:
                    </p>
                    <div className="text-sm text-muted">
                        <div>👑 Admin: <code>admin</code> / <code>admin123</code></div>
                        <div style={{ marginTop: '0.25rem' }}>👷 Técnico: <code>tecnico1</code> / <code>tecnico123</code></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
