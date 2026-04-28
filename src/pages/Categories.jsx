import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Lock, Tags } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useAuthStore } from '../store/useAuthStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { defaultCategories } from '../data/defaultCategories'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
  '#6B7280', '#78716C',
]

function CategoryForm({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: '', icone: '', tipo: 'DESPESA', cor: COLORS[0] })
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome obrigatório.'); return }
    if (!form.icone.trim()) { setError('Selecione um ícone.'); return }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-[1fr_72px] gap-3">
        <Input label="Nome" placeholder="Ex: Academia" value={form.nome} onChange={set('nome')} required />
        <div ref={pickerRef} className="relative">
          <label className="form-label">Ícone</label>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className={`w-full h-[38px] text-2xl border rounded-lg transition-colors flex items-center justify-center ${
              pickerOpen
                ? 'border-primary-500 ring-2 ring-primary-100'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            {form.icone || <span className="text-gray-300 text-base">😀</span>}
          </button>
          {pickerOpen && (
            <div className="fixed z-[300] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:absolute sm:left-auto sm:translate-x-0 sm:top-full sm:right-0 sm:translate-y-0 sm:mt-1">
              <EmojiPicker
                onEmojiClick={(data) => { set('icone')(data.emoji); setPickerOpen(false) }}
                height={350}
                width={300}
                searchPlaceholder="Buscar emoji..."
                lazyLoadEmojis
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="form-label">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {['DESPESA', 'RECEITA'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('tipo')(t)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.tipo === t
                  ? t === 'DESPESA'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t === 'DESPESA' ? '💸 Despesa' : '💰 Receita'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set('cor')(c)}
              className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${form.cor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {form.nome && form.icone && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: form.cor + '30' }}>
            {form.icone}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{form.nome}</p>
            <p className="text-xs text-gray-400">{form.tipo === 'DESPESA' ? 'Despesa' : 'Receita'}</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">Criar categoria</Button>
      </div>
    </form>
  )
}

function CategoryRow({ cat, onRemove, isDefault }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat.cor + '30' }}>
        {cat.icone}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{cat.nome}</p>
        <p className="text-xs text-gray-400">{cat.tipo === 'DESPESA' ? 'Despesa' : 'Receita'}</p>
      </div>
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: cat.cor }}
      />
      {isDefault ? (
        <Lock size={13} className="text-gray-300 shrink-0" title="Categoria padrão" />
      ) : (
        <button
          onClick={() => onRemove(cat.id)}
          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Remover categoria"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

export default function Categories() {
  const { user, casal } = useAuthStore()
  const categoryStore = useCategoryStore()

  const casalId = casal?.id || user?.id
  const { confirm, dialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterTipo, setFilterTipo] = useState('TODOS')

  const customActive = useMemo(
    () => categoryStore.custom.filter((c) => c.casalId === casalId && c.ativo),
    [categoryStore.custom, casalId]
  )

  const filtered = (list) =>
    filterTipo === 'TODOS' ? list : list.filter((c) => c.tipo === filterTipo)

  const handleSave = (data) => {
    categoryStore.add(casalId, data)
    setModalOpen(false)
  }

  const handleRemove = async (id) => {
    if (await confirm('Remover esta categoria? Transações existentes não serão afetadas.', 'Remover')) {
      categoryStore.remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {defaultCategories.length} padrão · {customActive.length} personalizada{customActive.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nova categoria</Button>
      </div>

      <div className="flex gap-2">
        {['TODOS', 'DESPESA', 'RECEITA'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTipo === t
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'TODOS' ? 'Todas' : t === 'DESPESA' ? '💸 Despesas' : '💰 Receitas'}
          </button>
        ))}
      </div>

      {customActive.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Personalizadas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered(customActive).map((cat) => (
              <CategoryRow key={cat.id} cat={cat} onRemove={handleRemove} isDefault={false} />
            ))}
            {filtered(customActive).length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Nenhuma categoria neste filtro.</p>
            )}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Padrão</h2>
          <Lock size={12} className="text-gray-400" />
        </div>
        <div className="divide-y divide-gray-50">
          {filtered(defaultCategories).map((cat) => (
            <CategoryRow key={cat.id} cat={cat} isDefault />
          ))}
        </div>
      </Card>

      {customActive.length === 0 && filterTipo === 'TODOS' && (
        <div className="text-center py-4">
          <Tags size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-3">Crie categorias personalizadas para organizar melhor suas finanças</p>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Criar categoria
          </Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova categoria">
        <CategoryForm onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>
      {dialog}
    </div>
  )
}
