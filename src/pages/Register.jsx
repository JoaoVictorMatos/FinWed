import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, CheckCircle2, Circle, X, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

// ─── Terms of Use Modal ───────────────────────────────────────────────────────

function TermsModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Termos de Uso — FinWed</h2>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-600">

          <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-primary-700 text-xs">
            Versão de teste (beta) — data de lançamento oficial a ser definida.
          </div>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">1. Armazenamento de dados</h3>
            <p className="leading-relaxed">
              Todas as informações inseridas no FinWed — incluindo transações, orçamentos, metas financeiras, categorias, dados de perfil e vínculos de casal — são armazenadas <strong>exclusivamente na memória local do seu navegador</strong> (localStorage).
            </p>
            <p className="leading-relaxed mt-2">
              Nenhum servidor externo, banco de dados remoto ou terceiro tem acesso às suas informações. <strong>Nenhum outro dispositivo</strong>, mesmo que pertença ao mesmo usuário, terá acesso aos dados cadastrados.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">2. Privacidade e segurança</h3>
            <p className="leading-relaxed">
              Por ser um sistema 100% local, a segurança dos seus dados é de sua responsabilidade. Recomendamos:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-500">
              <li>Não usar o FinWed em computadores públicos ou compartilhados.</li>
              <li>Não limpar os dados do navegador sem antes exportar suas informações.</li>
              <li>Manter o dispositivo com acesso restrito por senha ou biometria.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">3. Perda de dados</h3>
            <p className="leading-relaxed">
              Ao limpar o cache ou dados do navegador, desinstalar o aplicativo, usar um perfil de navegação privado (aba anônima) ou acessar por outro dispositivo, <strong>suas informações não estarão disponíveis</strong>. O FinWed não se responsabiliza por perda de dados decorrente desses cenários.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">4. Versão de teste</h3>
            <p className="leading-relaxed">
              A versão atual do FinWed é uma <strong>versão de teste (beta)</strong> com validade de <strong>1 mês</strong> a partir da data de lançamento oficial, ainda a ser definida. Durante o período de teste:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-gray-500">
              <li>Funcionalidades podem ser alteradas, adicionadas ou removidas sem aviso prévio.</li>
              <li>Instabilidades pontuais podem ocorrer.</li>
              <li>Após o encerramento do período de teste, novos termos e condições poderão ser aplicados.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-1.5">5. Aceitação</h3>
            <p className="leading-relaxed">
              Ao criar uma conta e utilizar o FinWed, você declara ter lido, compreendido e concordado com todos os termos descritos acima.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <Button className="w-full" onClick={onClose}>Entendi</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Register page ────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirma: '' })
  const [termos, setTermos] = useState(false)
  const [termosOpen, setTermosOpen] = useState(false)
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
    if (!termos) e.termos = 'Você deve aceitar os Termos de Uso para continuar.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.nome.trim(), form.email, form.senha)
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
        {/* Logo */}
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
                { label: 'Mínimo de 8 caracteres',    met: form.senha.length >= 8 },
                { label: 'Uma letra maiúscula',        met: /[A-Z]/.test(form.senha) },
                { label: 'Uma letra minúscula',        met: /[a-z]/.test(form.senha) },
                { label: 'Um número',                  met: /[0-9]/.test(form.senha) },
                { label: 'Um caractere especial',      met: /[!@#$%^&*(),.?":{}|<>]/.test(form.senha) },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                  {req.met ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Input label="Confirmar senha" type="password" placeholder="Repita a senha" value={form.confirma} onChange={set('confirma')} error={errors.confirma} required />

          {/* Terms checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => { setTermos((v) => !v); setErrors((e) => ({ ...e, termos: undefined })) }}
                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors
                  ${termos
                    ? 'bg-primary-600 border-primary-600'
                    : errors.termos
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-primary-400'
                  }`}
              >
                {termos && (
                  <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2">
                    <polyline points="1.5,5.5 4.5,8.5 10.5,1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-600 leading-snug">
                Li e concordo com os{' '}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setTermosOpen(true) }}
                  className="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  Termos de Uso
                </button>
              </span>
            </label>
            {errors.termos && (
              <p className="text-xs text-red-500 mt-1.5 ml-8">{errors.termos}</p>
            )}
          </div>

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

      <TermsModal open={termosOpen} onClose={() => setTermosOpen(false)} />
    </div>
  )
}
