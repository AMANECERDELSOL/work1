import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WorkList from './pages/WorkList'
import Calendar from './pages/Calendar'
import HazardReports from './pages/HazardReports'
import AdminPanel from './pages/AdminPanel'
import TechMonitor from './pages/TechMonitor'
import Chat from './pages/Chat'
import './App.css'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState(null)

    useEffect(() => {
        // Verificar si hay sesión activa en localStorage
        const token = localStorage.getItem('fsm_token')
        const userData = localStorage.getItem('fsm_user')

        if (token && userData) {
            try {
                setIsAuthenticated(true)
                setUser(JSON.parse(userData))
            } catch (err) {
                // Si hay error al parsear, limpiar localStorage
                localStorage.removeItem('fsm_token')
                localStorage.removeItem('fsm_user')
            }
        }
    }, [])

    const handleLogin = (token, userData) => {
        localStorage.setItem('fsm_token', token)
        localStorage.setItem('fsm_user', JSON.stringify(userData))
        setIsAuthenticated(true)
        setUser(userData)
    }

    const handleLogout = () => {
        localStorage.removeItem('fsm_token')
        localStorage.removeItem('fsm_user')
        setIsAuthenticated(false)
        setUser(null)
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated ?
                            <Navigate to="/dashboard" /> :
                            <Login onLogin={handleLogin} />
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        isAuthenticated ?
                            <Dashboard user={user} onLogout={handleLogout} /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/works"
                    element={
                        isAuthenticated ?
                            <WorkList user={user} onLogout={handleLogout} /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        isAuthenticated ?
                            <Calendar user={user} onLogout={handleLogout} /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/hazards"
                    element={
                        isAuthenticated ?
                            <HazardReports user={user} onLogout={handleLogout} /> :
                            <Navigate to="/login" />
                    }
                />
                <Route
                    path="/admin"
                    element={
                        isAuthenticated && user?.role === 'ADMIN' ?
                            <AdminPanel user={user} onLogout={handleLogout} /> :
                            <Navigate to="/dashboard" />
                    }
                />
                <Route
                    path="/monitor"
                    element={
                        isAuthenticated && user?.role === 'ADMIN' ?
                            <TechMonitor user={user} onLogout={handleLogout} /> :
                            <Navigate to="/dashboard" />
                    }
                />
                <Route
                    path="/chat"
                    element={
                        isAuthenticated ?
                            <Chat user={user} onLogout={handleLogout} /> :
                            <Navigate to="/login" />
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    )
}

export default App
