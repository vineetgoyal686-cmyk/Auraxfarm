import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import FieldApp from './pages/FieldApp.jsx'
import AdminApp from './pages/AdminApp.jsx'
import { pullAll } from './lib/sync.js'

export default function App() {
  const { isAuthenticated, role, loading } = useAuth()

  useEffect(() => {
    if (isAuthenticated) pullAll()
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-gray-500 text-sm font-semibold">
        Loading KisanSetu&hellip;
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : role === 'admin' ? (
            <AdminApp />
          ) : (
            <FieldApp />
          )
        }
      />
    </Routes>
  )
}
