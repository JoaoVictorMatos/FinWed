import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useTransactionStore } from '../store/useTransactionStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { formatCurrency, formatDateInput, getMonthYear } from '../utils/formatters'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CurrencyInput from '../components/ui/CurrencyInput'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'

const emptyForm = () => ({
  valor: '',
  tipo: 'DESPESA',
  escopo: 'PESSOAL',
  descricao: '',
  dataTransacao: formatDateInput(new Date()),
  categoriaId: '',
  divisaoA: '50',
  divisaoB: '50',
})

function TransactionForm({ initial, onSave, onClose, categories }) {
  const [form, setForm] = useState(initial || emptyForm())
  const [error, setError] = useState('')

  const set = (k) => (e) => {
    setForm((f) => {
      const next = { ...f, [k]: e.target.value }
      if (k === 'divisaoA') next.divisaoB = String(100 - Number(e.target.value))
      return next
    })
  }

  const filteredCats = categories.filter((c) => c.tipo === form.tipo || c.tipo === 'AMBOS')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.categoriaId) { setError('Selecione uma categoria.'); return }
    if (!form.valor || Number(form.valor) <= 0) { setError('Valor inválido.'); return }
    if (form.escopo === 'COMPARTILHADA') {
      const total = Number(form.divisaoA) + Number(form.divisaoB)
      if (Math.abs(total - 100) > 0.01) { setError('A divisão deve somar 100%.'); return }
    }
    try {
      onSave({ ...form, valor: Number(form.valor), divisaoA: Number(form.divisaoA), divisaoB: Number(form.divisaoB) })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" value={form.tipo} onChange={set('tipo')}>
          <option value="DESPESA">Despesa</option>
          <option value="RECEITA">Receita</option>
        </Select>
        <Select label="Escopo" value={form.escopo} onChange={set('escopo')}>
          <option value="PESSOAL">Pessoal</option>
          <option value="COMPARTILHADA" disabled>Compartilhada (Em breve)</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CurrencyInput label="Valor (R$)" placeholder="0,00" value={form.valor} onChange={set('valor')} required />
        <Input label="Data" type="date" value={form.dataTransacao} onChange={set('dataTransacao')} required />
      </div>

      <Select label="Categoria" value={form.categoriaId} onChange={set('categoriaId')}>
        <option value="">Selecione...</option>
        {filteredCats.map((c) => (
          <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
        ))}
      </Select>

      <Input label="Descrição (opcional)" placeholder="Ex: Almoço no restaurante" value={form.descricao} onChange={set('descricao')} />

      {form.escopo === 'COMPARTILHADA' && (
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700">Divisão da despesa</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Você (%)" type="number" min="0" max="100" value={form.divisaoA} onChange={set('divisaoA')} />
            <Input label="Parceiro(a) (%)" type="number" min="0" max="100" value={form.divisaoB} readOnly className="bg-blue-50" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">Salvar</Button>
      </div>
    </form>
  )
}

export default function Transactions() {
  const { user, casal } = useAuthStore()
  const txStore = useTransactionStore()
  const catStore = useCategoryStore()

  const casalId = casal?.id || user?.id
  const categories = useMemo(() => catStore.all(casalId), [catStore.custom, casalId])

  const { confirm, dialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEscopo, setFilterEscopo] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(
    `${getMonthYear().ano}-${String(getMonthYear().mes).padStart(2, '0')}`
  )

  const allTxs = useMemo(() => txStore.forCouple(casalId, user?.id), [txStore.transactions, casalId, user?.id])

  const filtered = useMemo(() => {
    return allTxs.filter((t) => {
      if (filterMonth && !t.dataTransacao.startsWith(filterMonth)) return false
      if (filterTipo && t.tipo !== filterTipo) return false
      if (filterEscopo && t.escopo !== filterEscopo) return false
      if (filterCat && t.categoriaId !== filterCat) return false
      if (search) {
        const q = search.toLowerCase()
        const cat = categories.find((c) => c.id === t.categoriaId)
        if (!t.descricao?.toLowerCase().includes(q) && !cat?.nome.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a, b) => b.dataTransacao.localeCompare(a.dataTransacao))
  }, [allTxs, filterMonth, filterTipo, filterEscopo, filterCat, search, categories])

  const totalReceitas = filtered.filter((t) => t.tipo === 'RECEITA').reduce((s, t) => s + Number(t.valor), 0)
  const totalDespesas = filtered.filter((t) => t.tipo === 'DESPESA').reduce((s, t) => s + Number(t.valor), 0)

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (t) => {
    setEditing({ ...t, valor: String(t.valor), divisaoA: String(t.divisaoA || 50), divisaoB: String(t.divisaoB || 50) })
    setModalOpen(true)
  }

  const handleSave = (data) => {
    if (editing) {
      txStore.update(editing.id, data)
    } else {
      txStore.add({ ...data, casalId, criadoPor: user.id })
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    if (await confirm('Excluir esta transação?', 'Excluir')) txStore.remove(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Nova transação</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas', value: totalReceitas, cls: 'text-green-600' },
          { label: 'Despesas', value: totalDespesas, cls: 'text-red-600' },
          { label: 'Saldo', value: totalReceitas - totalDespesas, cls: totalReceitas - totalDespesas >= 0 ? 'text-gray-900' : 'text-red-600' },
        ].map(({ label, value, cls }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${cls}`}>{formatCurrency(value)}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input
            type="month"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </Select>
          <Select value={filterEscopo} onChange={(e) => setFilterEscopo(e.target.value)}>
            <option value="">Todos os escopos</option>
            <option value="PESSOAL">Pessoal</option>
            <option value="COMPARTILHADA" disabled>Compartilhada (Em breve)</option>
          </Select>
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
          </Select>
        </div>
      </Card>

      {/* List */}
      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma transação encontrada</p>
            <Button onClick={openNew} variant="secondary" size="sm" className="mt-3">
              <Plus size={14} /> Adicionar primeira transação
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.categoriaId)
              const isOwn = t.criadoPor === user?.id
              return (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: cat?.cor + '20' }}>
                    {cat?.icone || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.descricao || cat?.nome || 'Sem descrição'}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{t.dataTransacao?.split('-').reverse().join('/')}</span>
                      <Badge variant={t.escopo === 'COMPARTILHADA' ? 'blue' : 'gray'}>
                        {t.escopo === 'COMPARTILHADA' ? '👫 Compartilhada' : '👤 Pessoal'}
                      </Badge>
                      {cat && <Badge variant="gray">{cat.nome}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className={`text-base font-bold ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.tipo === 'RECEITA' ? '+' : '-'}{formatCurrency(t.valor)}
                    </span>
                  </div>
                  {isOwn && (
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar transação' : 'Nova transação'}>
        <TransactionForm
          initial={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
      {dialog}
    </div>
  )
}
