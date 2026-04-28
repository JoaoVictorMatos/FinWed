import { useState, useRef } from 'react'
import { User, Heart, UserPlus, UserMinus, Save, Shield, Camera } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useConfirm } from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

function ProfileSection() {
  const { user, updateProfile } = useAuthStore()
  const [form, setForm] = useState({ nome: user?.nome || '', email: user?.email || '' })
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({ nome: form.nome.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 200
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE } }
        else        { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        try { updateProfile({ avatarUrl: canvas.toDataURL('image/jpeg', 0.8) }) }
        catch { alert('Erro ao salvar imagem. Ela pode ser muito grande.') }
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <User size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Meu perfil</h2>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl cursor-pointer group overflow-hidden shrink-0"
        >
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            : user?.nome?.[0]?.toUpperCase()
          }
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
        <div>
          <p className="font-semibold text-gray-900">{user?.nome}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <Badge variant="blue" className="mt-1">
            Membro desde {new Date(user?.criadoEm).toLocaleDateString('pt-BR')}
          </Badge>
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
  const { confirm, dialog } = useConfirm()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null) // { type, msg }

  const handleSendInvite = (e) => {
    e.preventDefault()
    try {
      sendInvite(inviteEmail.trim())
      setInviteStatus({
        type: 'success',
        msg: `Convite registrado para ${inviteEmail.trim()}. Quando essa pessoa fizer login no FinWed neste dispositivo, o convite aparecerá automaticamente.`,
      })
      setInviteEmail('')
    } catch (err) {
      setInviteStatus({ type: 'error', msg: err.message })
    }
  }

  const handleDissolve = async () => {
    const ok = await confirm(
      'Desvincular o casal? As finanças pessoais de cada um serão mantidas, mas os dados compartilhados não serão excluídos.',
      'Desvincular'
    )
    if (ok) dissolveCouple()
  }

  if (casal && partner) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <Heart size={18} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Gestão do casal</h2>
        </div>

        <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-100 rounded-xl mb-5">
          <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
            {partner.avatarUrl
              ? <img src={partner.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              : partner.nome?.[0]?.toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{partner.nome}</p>
            <p className="text-xs text-gray-500 truncate">{partner.email}</p>
          </div>
          <Badge variant="green">Vinculado</Badge>
        </div>

        <button
          onClick={handleDissolve}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <UserMinus size={14} /> Desvincular casal
        </button>
        {dialog}
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <Heart size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Gestão do casal</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Vincule-se ao seu parceiro(a) para compartilhar finanças e metas.
      </p>

      <form onSubmit={handleSendInvite} className="space-y-3 max-w-sm">
        <Input
          label="E-mail do parceiro(a)"
          type="email"
          placeholder="parceiro@email.com"
          value={inviteEmail}
          onChange={(e) => { setInviteEmail(e.target.value); setInviteStatus(null) }}
          required
        />
        {inviteStatus && (
          <div className={`p-3 rounded-lg text-xs leading-relaxed border
            ${inviteStatus.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            {inviteStatus.msg}
          </div>
        )}
        <Button type="submit" size="sm">
          <UserPlus size={14} /> Enviar convite
        </Button>
      </form>

      <div className="mt-5 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-700">Como funciona:</strong> o convite fica registrado no dispositivo. Quando seu parceiro(a) fizer login ou se cadastrar com o e-mail informado, um banner de aceite aparecerá automaticamente.
      </div>
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
            <p className="font-medium text-gray-800">Senha protegida</p>
            <p className="text-gray-500 text-xs mt-0.5">Sua senha é armazenada como hash SHA-256 — nunca em texto puro. Nem você consegue recuperá-la, apenas redefini-la.</p>
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
