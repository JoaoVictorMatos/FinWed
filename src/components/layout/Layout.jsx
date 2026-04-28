import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/useAuthStore'
import { Bell, UserPlus } from 'lucide-react'
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'

function InviteBanner() {
  return null
}

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pb-0 pb-16">
        <MobileHeader />
        <InviteBanner />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
