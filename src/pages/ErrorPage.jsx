import { useNavigate } from 'react-router-dom'
import { Heart, Home, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Button from '../components/ui/Button'

export default function ErrorPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Heart size={18} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FinWed</span>
        </div>

        <p className="text-8xl font-black text-primary-100 leading-none select-none">404</p>

        <h1 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          O endereço que você tentou acessar não existe ou foi removido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/login')}
          >
            <LogIn size={16} /> Ir para o Login
          </Button>
          {user && (
            <Button
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Home size={16} /> Ir para o Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
