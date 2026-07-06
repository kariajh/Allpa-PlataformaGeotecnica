import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const modules = [
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/sondeos', label: 'Sondeos' },
  { to: '/spt', label: 'SPT' },
  { to: '/cpt', label: 'CPT' },
  { to: '/estratigrafia', label: 'Estratigrafía / Muestras' },
  { to: '/multimedia', label: 'Multimedia' },
  { to: '/auditoria', label: 'Auditoría' },
  { to: '/dispositivos', label: 'Dispositivos' },
  { to: '/sync', label: 'Sincronización' },
]

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border h-screen sticky top-0 p-4">
      <div className="font-semibold text-lg mb-6 px-2">GeoField</div>
      <nav className="flex flex-col gap-1">
        {modules.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              cn(
                'px-2 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50'
              )
            }
          >
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
