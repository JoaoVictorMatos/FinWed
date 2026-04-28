import { useState, useRef } from 'react'
import { User, Mail, Heart, UserPlus, UserMinus, Save, Shield, Camera } from 'lucide-react'
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
  const fileInputRef = useRef(null)
  
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({ nome: form.nome.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // compress as jpeg
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        try {
          updateProfile({ avatarUrl: base64 })
        } catch (err) {
          alert('Erro ao salvar imagem. Ela pode ser muito grande.')
        }
      }
      img.src = event.target.result
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
          onClick={handlePhotoClick}
          className="relative w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl cursor-pointer group overflow-hidden shrink-0"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user?.nome?.[0]?.toUpperCase()
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoChange} 
          accept="image/*" 
          className="hidden" 
        />
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
  return (
    <Card className="p-6 opacity-75">
      <div className="flex items-center gap-3 mb-5">
        <Heart size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Gestão do casal</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1 flex items-center gap-2">
            <span>🔒</span> Em breve
          </p>
          <p>Esta atualização será lançada em breve. Por enquanto, o sistema oferece serviços de gestão pessoal apenas.</p>
        </div>
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
