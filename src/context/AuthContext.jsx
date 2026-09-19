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

    // Supabase fires an initial "INITIAL_SESSION" event on subscribe, often
    // before the getSession() call above has finished reading the persisted
    // session from storage — if that fires with session=null first, the app
    // would flash a "logged out" state on every reload even though a valid
    // session exists. getSession() above is the source of truth for the
    // first load, so only react to *subsequent* real auth changes here.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'INITIAL_SESSION') return
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
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
      setRole(data?.role || 'field')
    } catch {
      setRole('field')
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('active').eq('id', data.user.id).single()
    if (profile && profile.active === false) {
      await supabase.auth.signOut()
      throw new Error('Your account has been disabled by an administrator.')
    }
  }

  async function signUp(email, password) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      // Self-service signup can only ever create Field User accounts.
      // Administrator accounts must be created/promoted directly in the database.
      await supabase.from('profiles').upsert({ id: data.user.id, email, role: 'field' })
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
