import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null) // 'field' | 'admin'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local-only demo mode: role/session kept in localStorage so the UI
      // is fully clickable before Supabase keys are added.
      const savedRole = localStorage.getItem('auraxfarm:demoRole')
      if (savedRole) setRole(savedRole)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadRole(data.session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadRole(newSession.user.id)
      else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadRole(userId) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setRole(data?.role || 'field')
    setLoading(false)
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, chosenRole) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, email, role: chosenRole })
    }
  }

  function signInDemo(chosenRole) {
    localStorage.setItem('auraxfarm:demoRole', chosenRole)
    setRole(chosenRole)
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    localStorage.removeItem('auraxfarm:demoRole')
    setSession(null)
    setRole(null)
  }

  const value = {
    session,
    role,
    loading,
    isSupabaseConfigured,
    signIn,
    signUp,
    signInDemo,
    signOut,
    isAuthenticated: isSupabaseConfigured ? Boolean(session) : Boolean(role)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
