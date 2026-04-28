import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Target, PiggyBank, User, LogOut, Heart } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export const navLinks = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/transacoes',   icon: ArrowLeftRight,  label: 'Transações'  },
  { to: '/orcamentos',   icon: PiggyBank,       label: 'Orçamentos'  },
  { to: '/metas',        icon: Target,          label: 'Metas'       },
  { to: '/perfil',       icon: User,            label: 'Perfil'      },
]

export default function Sidebar() {
  const { user, partner, logout } = useAuthStore()

  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-100 flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">FinWed</span>
        </div>
      </div>

      {/* Couple indicator */}
      {/* 
      {partner && (
        <div className="mx-3 mt-3 px-3 py-2 bg-primary-50 rounded-lg">
          <p className="text-xs text-primary-600 font-medium">Casal com</p>
          <p className="text-sm font-semibold text-primary-800 truncate">{partner.nome}</p>
        </div>
      )}
      */}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.nome?.[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
