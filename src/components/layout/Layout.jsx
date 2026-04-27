import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/useAuthStore'
import { Bell, UserPlus } from 'lucide-react'
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function InviteBanner() {
  const { pendingInvite, acceptInvite, rejectInvite } = useAuthStore()
  if (!pendingInvite) return null
  return (
    <div className="bg-primary-600 text-white px-6 py-3 flex items-center gap-4 text-sm">
      <UserPlus size={16} />
      <span className="flex-1">
        <strong>{pendingInvite.remetenteNome}</strong> te convidou para formar um casal no FinWed!
      </span>
      <button onClick={acceptInvite} className="bg-white text-primary-700 font-semibold px-3 py-1 rounded-lg text-xs hover:bg-primary-50 transition-colors">
        Aceitar
      </button>
      <button onClick={rejectInvite} className="text-primary-200 hover:text-white transition-colors text-xs">
        Recusar
      </button>
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InviteBanner />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
