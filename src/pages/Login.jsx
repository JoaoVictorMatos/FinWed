import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Heart, Clock } from 'lucide-react'
import { useAuthStore, hashPassword } from '../store/useAuthStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Footer from '../components/layout/Footer'

export default function Login() {
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Recover modal state
  const [recoverModal, setRecoverModal] = useState(false)
  const [recoverStep, setRecoverStep] = useState('email') // 'email' | 'reset'
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.senha)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openRecoverModal = () => {
    setRecoverStep('email')
    setRecoverEmail(form.email)
    setRecoverError('')
    setNewPwd('')
    setConfirmPwd('')
    setResetDone(false)
    setRecoverModal(true)
  }

  const handleFindUser = (e) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('finwed_users') || '[]')
    const found = users.find((u) => u.email === recoverEmail.trim())
    if (found) {
      setRecoverStep('reset')
      setRecoverError('')
    } else {
      setRecoverError('E-mail não encontrado no sistema.')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPwd.length < 8)         { setRecoverError('Mínimo de 8 caracteres.'); return }
    if (newPwd !== confirmPwd)      { setRecoverError('As senhas não conferem.'); return }
    setResetLoading(true)
    const hash  = await hashPassword(newPwd)
    const users = JSON.parse(localStorage.getItem('finwed_users') || '[]')
    const updated = users.map((u) => u.email === recoverEmail.trim() ? { ...u, senha: hash } : u)
    localStorage.setItem('finwed_users', JSON.stringify(updated))
    setForm({ email: recoverEmail.trim(), senha: newPwd })
    setResetDone(true)
    setResetLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col items-center justify-center p-4">
      <div className="flex-1 flex flex-col justify-center w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl w-full p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">FinWed</span>
          </div>

          {locationState?.expired && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 mb-5 text-sm text-yellow-800">
              <Clock size={15} className="shrink-0 text-yellow-600" />
              Sessão encerrada por inatividade. Faça login novamente.
            </div>
          )}

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mb-6">Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="E-mail" type="email" placeholder="seu@email.com"
              value={form.email} onChange={set('email')} required />
            <div>
              <Input label="Senha" type="password" placeholder="••••••••"
                value={form.senha} onChange={set('senha')} required />
              <div className="flex justify-end mt-1">
                <button type="button" onClick={openRecoverModal}
                  className="text-xs text-primary-600 hover:underline">
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

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
            <strong>Demo:</strong> cadastre-se para testar — os dados ficam no navegador.
          </div>
        </div>
      </div>
      
      <Footer theme="dark" />

      {/* Recover password modal */}
      <Modal open={recoverModal} onClose={() => setRecoverModal(false)} title="Redefinir senha">
        {resetDone ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm text-gray-700 font-medium">Senha redefinida com sucesso!</p>
            <p className="text-xs text-gray-500">O formulário de login já foi preenchido. Clique em Entrar.</p>
            <Button className="w-full" onClick={() => setRecoverModal(false)}>Fechar</Button>
          </div>
        ) : recoverStep === 'email' ? (
          <form onSubmit={handleFindUser} className="space-y-4">
            <p className="text-sm text-gray-600">Informe seu e-mail para redefinir a senha.</p>
            <Input label="E-mail cadastrado" type="email" placeholder="seu@email.com"
              value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)} required />
            {recoverError && <p className="text-xs text-red-500">{recoverError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRecoverModal(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" className="flex-1">Continuar</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-600">
              Conta encontrada. Defina uma nova senha para <strong>{recoverEmail}</strong>.
            </p>
            <Input label="Nova senha" type="password" placeholder="Mínimo 8 caracteres"
              value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
            <Input label="Confirmar nova senha" type="password" placeholder="Repita a senha"
              value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
            {recoverError && <p className="text-xs text-red-500">{recoverError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRecoverStep('email')} className="flex-1">Voltar</Button>
              <Button type="submit" className="flex-1" disabled={resetLoading}>
                {resetLoading ? 'Salvando...' : 'Redefinir senha'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
