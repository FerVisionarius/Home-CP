import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, SUPABASE_FUNCTIONS_URL, SUPABASE_KEY } from './lib/supabase'
import { signInWithLockout } from './lib/authLogin'
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

// Accesos a herramientas concretos de este usuario (además del rol).
async function fetchToolAccess() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data } = await supabase
    .from('user_tool_access')
    .select('tool_id, enabled')
    .eq('user_id', user.id)

  const map = {}
  ;(data || []).forEach(r => { map[r.tool_id] = r.enabled })
  return map
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [toolAccess, setToolAccess] = useState({})
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    const { data, error } = await supabase.rpc('get_my_profile')
    if (!error && data) {
      setProfile(data)
      const [perms, tools] = await Promise.all([
        fetchPermissions(data.role),
        fetchToolAccess(),
      ])
      setPermissions(perms)
      setToolAccess(tools)
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
          setToolAccess({})
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

  async function signIn(email, password, captchaToken) {
    return signInWithLockout(supabase, SUPABASE_FUNCTIONS_URL, SUPABASE_KEY, email, password, captchaToken)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isSuperAdmin = profile?.role === 'superadmin'
  const isAdmin = profile?.role === 'admin' || isSuperAdmin

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isSuperAdmin, permissions, toolAccess, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
