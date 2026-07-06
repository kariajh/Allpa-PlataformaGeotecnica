import { useSyncStore } from '@/stores/syncStore'
import { cn } from '@/lib/utils'

export function OnlineBadge() {
  const isOnline = useSyncStore((s) => s.isOnline)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn('h-2 w-2 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-amber-500')}
      />
      <span className="text-muted-foreground">
        {isOnline ? 'En línea' : 'Sin conexión'}
        {pendingCount > 0 && ` · ${pendingCount} pendiente(s) de sincronizar`}
      </span>
    </div>
  )
}
