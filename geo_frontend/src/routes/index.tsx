import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

import ProyectosPage from '@/features/proyectos/pages/ProyectosPage'
import SondeosPage from '@/features/sondeos/pages/SondeosPage'
import SptPage from '@/features/spt/pages/SptPage'
import CptPage from '@/features/cpt/pages/CptPage'
import EstratigrafiaPage from '@/features/estratigrafia/pages/EstratigrafiaPage'
import MultimediaPage from '@/features/multimedia/pages/MultimediaPage'
import AuditoriaPage from '@/features/auditoria/pages/AuditoriaPage'
import DispositivosPage from '@/features/dispositivos/pages/DispositivosPage'
import SyncPage from '@/features/sync/pages/SyncPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/proyectos" replace /> },
      { path: 'proyectos', element: <ProyectosPage /> },
      { path: 'sondeos', element: <SondeosPage /> },
      { path: 'spt', element: <SptPage /> },
      { path: 'cpt', element: <CptPage /> },
      { path: 'estratigrafia', element: <EstratigrafiaPage /> },
      { path: 'multimedia', element: <MultimediaPage /> },
      { path: 'auditoria', element: <AuditoriaPage /> },
      { path: 'dispositivos', element: <DispositivosPage /> },
      { path: 'sync', element: <SyncPage /> },
    ],
  },
])
