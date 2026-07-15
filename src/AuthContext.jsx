import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { isAuthRecoveryRoute } from './lib/authRecovery'

const AuthContext = createContext(null)
const AUTH_INIT_TIMEOUT_MS = 8 * 1000

async function fetchPermissions(role) {
  if (!role) return {}
  const { data } = await supabase
    .from('role_permissions')
    .select('item_id, enabled')
    .eq('role', role)

  const map = {}
  ;(data || []).forEach(r => { map[r.item_id] = r.enabled })
  return map
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    const { data, error } = await supabase.rpc('get_my_profile')
    if (!error && data) {
      setProfile(data)
      setPermissions(await fetchPermissions(data.role))
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    const initTimeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, AUTH_INIT_TIMEOUT_MS)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        clearTimeout(initTimeout)
        setUser(session?.user ?? null)
        if (session?.user) {
          if (isAuthRecoveryRoute()) setLoading(false)
          else fetchProfile()
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTimeout(initTimeout)
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        if (cancelled) return
        setUser(session?.user ?? null)
        if (session?.user) {
          if (event === 'PASSWORD_RECOVERY' || isAuthRecoveryRoute()) {
            setLoading(false)
            return
          }
          setLoading(true)
          fetchProfile()
        } else {
          setProfile(null)
          setPermissions({})
          setLoading(false)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      clearTimeout(initTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isSuperAdmin = profile?.role === 'superadmin'
  const isAdmin = profile?.role === 'admin' || isSuperAdmin

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isSuperAdmin, permissions, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
