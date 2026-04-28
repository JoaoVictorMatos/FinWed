import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, CheckCircle2, Circle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirma: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Nome obrigatório.'
    if (!form.email.includes('@')) e.email = 'E-mail inválido.'
    
    const pwd = form.senha
    if (pwd.length < 8) {
      e.senha = 'Mínimo de 8 caracteres.'
    } else if (!/[A-Z]/.test(pwd)) {
      e.senha = 'Deve conter pelo menos uma letra maiúscula.'
    } else if (!/[a-z]/.test(pwd)) {
      e.senha = 'Deve conter pelo menos uma letra minúscula.'
    } else if (!/[0-9]/.test(pwd)) {
      e.senha = 'Deve conter pelo menos um número.'
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      e.senha = 'Deve conter pelo menos um caractere especial.'
    }

    if (form.senha !== form.confirma) e.confirma = 'As senhas não conferem.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      register(form.nome.trim(), form.email, form.senha)
      navigate('/')
    } catch (err) {
      setErrors({ email: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">FinWed</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Criar conta</h1>
        <p className="text-sm text-gray-500 mb-6">Comece a gerenciar suas finanças</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome completo" placeholder="Seu nome" value={form.nome} onChange={set('nome')} error={errors.nome} required />
          <Input label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} error={errors.email} required />
          <div>
            <Input label="Senha" type="password" placeholder="Sua senha secreta" value={form.senha} onChange={set('senha')} error={errors.senha} required />
            <div className="mt-3 space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">Requisitos da senha:</p>
              {[
                { label: 'Mínimo de 8 caracteres', met: form.senha.length >= 8 },
                { label: 'Uma letra maiúscula', met: /[A-Z]/.test(form.senha) },
                { label: 'Uma letra minúscula', met: /[a-z]/.test(form.senha) },
                { label: 'Um número', met: /[0-9]/.test(form.senha) },
                { label: 'Um caractere especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(form.senha) },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                  {req.met ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Input label="Confirmar senha" type="password" placeholder="Repita a senha" value={form.confirma} onChange={set('confirma')} error={errors.confirma} required />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
