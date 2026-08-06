import { useAuth } from './AuthContext'
import logo from './assets/logo-clubpilates.png'

const TOOLS = [
  {
    id: 'analytics',
    label: 'Analytics',
    desc: 'Dashboard de KPIs por centro',
    url: 'https://analytics.clubpilatesia.es',
    alwaysVisible: true,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m6 10V11m-9 6h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'crm',
    label: 'CRM',
    desc: 'Contactos, llamadas y conversaciones',
    url: 'https://crm.clubpilatesia.es',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'desarrollo',
    label: 'Desarrollo',
    desc: 'Pruebas de agentes de chat y Retell',
    url: 'https://developer.clubpilatesia.es',
    restricted: true,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
]

export default function Launcher() {
  const { profile, permissions, toolAccess, isSuperAdmin, signOut } = useAuth()

  const visibleTools = TOOLS.filter(tool => {
    // Herramientas restringidas: visibles para superadmin o para usuarios con
    // acceso explícito concedido en Ajustes (independiente del rol).
    if (tool.restricted) return isSuperAdmin || toolAccess[tool.id] === true
    return tool.alwaysVisible || permissions[tool.id] !== false
  })

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      <img src={logo} alt="Club Pilates" className="h-35 w-auto mb-2" />
      <h1 className="text-2xl font-bold text-text-100 mt-6 text-center">Club Pilates</h1>
      <p className="text-text-200 text-sm mb-2 text-center">Accede a las herramientas del equipo</p>
      {profile?.email && (
        <p className="text-xs text-primary-300 mb-10">{profile.email}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {visibleTools.map(tool => (
          <a
            key={tool.id}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-bg-200 border border-bg-300 rounded-2xl p-6 flex flex-col gap-3 hover:border-accent-100 hover:shadow-md transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-100 text-accent-200 flex items-center justify-center group-hover:bg-accent-200 group-hover:text-white transition-colors">
              <span className="w-5 h-5 block">{tool.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-text-100">{tool.label}</p>
              <p className="text-sm text-text-200 mt-0.5">{tool.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <button
        onClick={signOut}
        className="text-xs text-text-200 hover:text-text-100 transition-colors mt-12 px-3 py-1.5 rounded hover:bg-bg-200"
      >
        Salir
      </button>

      <footer className="text-xs text-bg-300 mt-10">&copy; {new Date().getFullYear()} Club Pilates</footer>
    </div>
  )
}
