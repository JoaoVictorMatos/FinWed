import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navLinks } from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function BottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  
  // Exibir os 4 primeiros links na barra inferior
  const mainLinks = navLinks.slice(0, 4)
  // O restante vai para o menu "Mais"
  const moreLinks = navLinks.slice(4)

  return (
    <>
      {/* Menu Overlay para os links adicionais */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Mais Opções</h3>
              <button onClick={() => setIsMoreOpen(false)} className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              {moreLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon size={24} className="mb-2" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navegação Inferior Principal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-50 pb-safe">
        {mainLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium truncate w-full text-center px-1">{label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isMoreOpen ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium truncate w-full text-center px-1">Mais</span>
        </button>
      </nav>
    </>
  )
}
