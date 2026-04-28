import { Heart } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { Link } from 'react-router-dom'

export default function MobileHeader() {
  const { user } = useAuthStore()

  return (
    <header className="md:hidden sticky top-0 bg-white border-b border-gray-100 h-14 z-40 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Heart size={16} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">FinWed</span>
      </div>
      
      <Link to="/perfil" className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden shrink-0">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          user?.nome?.[0]?.toUpperCase()
        )}
      </Link>
    </header>
  )
}
