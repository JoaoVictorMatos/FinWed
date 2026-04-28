import { useState } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import { useInactivityTimer } from '../../hooks/useInactivityTimer'
import { useAuthStore } from '../../store/useAuthStore'
import { Clock, X, Heart } from 'lucide-react'
import Button from '../ui/Button'

function InviteBanner() {
  const { pendingInvite, acceptInvite, rejectInvite } = useAuthStore()
  const [loading, setLoading] = useState(false)

  if (!pendingInvite) return null

  const handleAccept = () => {
    setLoading(true)
    try { acceptInvite() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="bg-primary-50 border-b border-primary-200 px-4 py-3 flex items-center gap-3 flex-wrap">
      <Heart size={15} className="text-primary-600 shrink-0" fill="currentColor" />
      <p className="flex-1 text-sm text-primary-800 min-w-0">
        <strong>{pendingInvite.remetenteNome}</strong> te convidou para gerenciar as finanças juntos!
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={rejectInvite}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Recusar
        </button>
        <Button size="sm" onClick={handleAccept} disabled={loading}>
          {loading ? '...' : 'Aceitar convite'}
        </Button>
      </div>
    </div>
  )
}

function InactivityWarning({ onKeepAlive, onDismiss }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
          <Clock size={15} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">Sessão expira em 5 min</p>
          <p className="text-xs text-gray-400 mt-0.5">Inatividade detectada</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" onClick={onKeepAlive}
            className="!bg-yellow-500 !text-gray-900 hover:!bg-yellow-400 !px-3 !py-1 text-xs font-semibold">
            Continuar
          </Button>
          <button onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const { showWarning, keepAlive } = useInactivityTimer()

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pb-0 pb-16 overflow-x-hidden">
        <MobileHeader />
        <InviteBanner />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
      {showWarning && (
        <InactivityWarning onKeepAlive={keepAlive} onDismiss={keepAlive} />
      )}
    </div>
  )
}
