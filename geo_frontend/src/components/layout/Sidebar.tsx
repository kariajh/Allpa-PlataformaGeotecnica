import { NavLink } from 'react-router-dom'
import {
  FolderKanban,
  Drill,
  Hammer,
  Gauge,
  Layers,
  Image,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const modules: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/sondeos', label: 'Sondeos', icon: Drill },
  { to: '/spt', label: 'SPT', icon: Hammer },
  { to: '/cpt', label: 'CPT', icon: Gauge },
  { to: '/estratigrafia', label: 'Estratigrafía / Muestras', icon: Layers },
  { to: '/multimedia', label: 'Multimedia', icon: Image },
  { to: '/auditoria', label: 'Auditoría', icon: ShieldCheck },
  { to: '/dispositivos', label: 'Dispositivos', icon: Smartphone },
  { to: '/sync', label: 'Sincronización', icon: RefreshCw },
]

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border h-screen sticky top-0 p-4">

      <div className="mb-6 px-2">
        <div className="flex items-center gap-2">
          <img src="icons/allpa-icon-64.png" alt="" className="h-6 w-6" />
          <span className="font-semibold text-lg leading-none">ALLPA</span>
        </div>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">
          Plataforma geotécnica
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {modules.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <m.icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-secondary-foreground' : 'text-muted-foreground'
                  )}
                  strokeWidth={2}
                />
                <span>{m.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}