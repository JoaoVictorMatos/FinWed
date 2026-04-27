import { useState } from 'react'
import { User, Mail, Heart, UserPlus, UserMinus, Save, Shield } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

function ProfileSection() {
  const { user, updateProfile } = useAuthStore()
  const [form, setForm] = useState({ nome: user?.nome || '', email: user?.email || '' })
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({ nome: form.nome.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <User size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Meu perfil</h2>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
          {user?.nome?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.nome}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <Badge variant="blue" className="mt-1">Membro desde {new Date(user?.criadoEm).toLocaleDateString('pt-BR')}</Badge>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <Input label="Nome" value={form.nome} onChange={set('nome')} required />
        <Input label="E-mail" value={form.email} disabled className="cursor-not-allowed" />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm"><Save size={14} /> Salvar</Button>
          {saved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
        </div>
      </form>
    </Card>
  )
}

function CoupleSection() {
  const { user, casal, partner, sendInvite, dissolveCouple } = useAuthStore()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [dissolveModal, setDissolveModal] = useState(false)

  const handleInvite = (e) => {
    e.preventDefault()
    setInviteMsg('')
    setInviteError('')
    try {
      sendInvite(inviteEmail)
      setInviteMsg(`Convite enviado para ${inviteEmail}. Peça ao seu parceiro(a) para criar uma conta com este e-mail.`)
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.message)
    }
  }

  const handleDissolve = () => {
    dissolveCouple()
    setDissolveModal(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <Heart size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Gestão do casal</h2>
      </div>

      {casal && partner ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
              {partner.nome?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary-900">{partner.nome}</p>
              <p className="text-sm text-primary-600">{partner.email}</p>
              <Badge variant="green" className="mt-1">✓ Casal ativo</Badge>
            </div>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            <p>Vocês estão conectados desde <strong>{new Date(casal.criadoEm).toLocaleDateString('pt-BR')}</strong>.</p>
            <p className="mt-1">Transações compartilhadas e orçamentos são visíveis para ambos.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDissolveModal(true)}>
            <UserMinus size={14} /> Dissolver vínculo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <p className="font-medium mb-1">Você ainda não tem parceiro(a) vinculado(a)</p>
            <p>Digite o e-mail do seu parceiro(a) para enviar um convite. Ele(a) precisará criar uma conta com esse e-mail.</p>
          </div>
          <form onSubmit={handleInvite} className="space-y-3 max-w-sm">
            <Input
              label="E-mail do parceiro(a)"
              type="email"
              placeholder="parceiro@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
            {inviteMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3">{inviteMsg}</p>}
            <Button type="submit" size="sm">
              <UserPlus size={14} /> Enviar convite
            </Button>
          </form>
        </div>
      )}

      <Modal open={dissolveModal} onClose={() => setDissolveModal(false)} title="Dissolver vínculo de casal">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-2">Atenção: ação irreversível</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O vínculo com <strong>{partner?.nome}</strong> será desfeito</li>
              <li>Os dados históricos serão preservados individualmente</li>
              <li>Transações compartilhadas continuarão visíveis para cada um</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDissolveModal(false)} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={handleDissolve} className="flex-1">Confirmar dissolução</Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

function SecuritySection() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <Shield size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Segurança e dados</h2>
      </div>
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-medium text-gray-800">Dados locais</p>
            <p className="text-gray-500 text-xs mt-0.5">Todos os seus dados estão armazenados apenas neste navegador via localStorage. Nada é enviado para servidores externos nesta versão.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">🛡️</span>
          <div>
            <p className="font-medium text-gray-800">Privacidade</p>
            <p className="text-gray-500 text-xs mt-0.5">Transações pessoais são visíveis apenas para você. Transações compartilhadas são visíveis para ambos os parceiros.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium text-gray-800">Atenção</p>
            <p className="text-gray-500 text-xs mt-0.5">Limpar os dados do navegador apagará todas as informações do FinWed. Faça backup exportando seus relatórios regularmente.</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Profile() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie suas informações e configurações</p>
      </div>
      <ProfileSection />
      <CoupleSection />
      <SecuritySection />
    </div>
  )
}
