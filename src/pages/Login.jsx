import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoverModal, setRecoverModal] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverResult, setRecoverResult] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      login(form.email, form.senha)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = (e) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('finwed_users') || '[]')
    const found = users.find((u) => u.email === recoverEmail)
    if (found) {
      setRecoverResult({ success: true, message: `Sua senha é: ${found.senha}` })
      setForm((f) => ({ ...f, email: found.email, senha: found.senha }))
    } else {
      setRecoverResult({ success: false, message: 'E-mail não encontrado no sistema.' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">FinWed</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Bem-vindo de volta</h1>
        <p className="text-sm text-gray-500 mb-6">Entre na sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={set('email')}
            required
          />
          <div>
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={set('senha')}
              required
            />
            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={() => { setRecoverModal(true); setRecoverResult(null); setRecoverEmail(form.email) }} 
                className="text-xs text-primary-600 hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-primary-600 font-medium hover:underline">
            Criar conta
          </Link>
        </p>

        {/* Demo hint */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
          <strong>Demo:</strong> cadastre-se para testar — os dados ficam no navegador.
        </div>
      </div>

      <Modal open={recoverModal} onClose={() => setRecoverModal(false)} title="Recuperar senha">
        <form onSubmit={handleRecover} className="space-y-4">
          <p className="text-sm text-gray-600">Como esta é uma versão demo (local), insira seu e-mail para exibir a senha salva no navegador.</p>
          <Input 
            label="E-mail cadastrado" 
            type="email" 
            placeholder="seu@email.com" 
            value={recoverEmail} 
            onChange={(e) => setRecoverEmail(e.target.value)} 
            required 
          />
          {recoverResult && (
            <div className={`p-3 rounded-lg text-sm ${recoverResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {recoverResult.success && <strong>Senha encontrada: </strong>}
              {recoverResult.message}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRecoverModal(false)} className="flex-1">
              {recoverResult?.success ? 'Fechar' : 'Cancelar'}
            </Button>
            {!recoverResult?.success && <Button type="submit" className="flex-1">Buscar senha</Button>}
          </div>
        </form>
      </Modal>
    </div>
  )
}
