import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { OnlineBadge } from './OnlineBadge'

export function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <header className="h-14 border-b border-border flex items-center justify-end px-6">
          <OnlineBadge />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
