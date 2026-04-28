import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Copy, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useBudgetStore } from '../store/useBudgetStore'
import { useTransactionStore } from '../store/useTransactionStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { formatCurrency, getMonthYear, monthName } from '../utils/formatters'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CurrencyInput from '../components/ui/CurrencyInput'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'

function BudgetForm({ initial, categories, onSave, onClose, usedCatIds }) {
  const [form, setForm] = useState(initial || { categoriaId: '', valorLimite: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const available = categories.filter(
    (c) => (c.tipo === 'DESPESA' || c.tipo === 'AMBOS') && (!usedCatIds.includes(c.id) || c.id === initial?.categoriaId)
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.categoriaId) { setError('Selecione uma categoria.'); return }
    if (!form.valorLimite || Number(form.valorLimite) <= 0) { setError('Valor inválido.'); return }
    try {
      onSave({ ...form, valorLimite: Number(form.valorLimite) })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Categoria" value={form.categoriaId} onChange={set('categoriaId')} disabled={!!initial}>
        <option value="">Selecione...</option>
        {available.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
      </Select>
      <CurrencyInput label="Limite mensal (R$)" placeholder="0,00"
        value={form.valorLimite} onChange={set('valorLimite')} required />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">Salvar</Button>
      </div>
    </form>
  )
}

export default function Budgets() {
  const { user, casal } = useAuthStore()
  const budgetStore = useBudgetStore()
  const txStore = useTransactionStore()
  const catStore = useCategoryStore()

  const casalId = casal?.id || user?.id
  const { confirm, dialog } = useConfirm()
  const now = new Date()
  const [selectedMes, setSelectedMes] = useState(now.getMonth() + 1)
  const [selectedAno, setSelectedAno] = useState(now.getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')

  const categories = useMemo(() => catStore.all(casalId), [catStore.custom, casalId])
  const budgets = useMemo(
    () => budgetStore.forMonth(casalId, selectedMes, selectedAno),
    [budgetStore.budgets, casalId, selectedMes, selectedAno]
  )
  const catTotals = useMemo(
    () => txStore.byCategory(casalId, user?.id, selectedMes, selectedAno),
    [txStore.transactions, casalId, user?.id, selectedMes, selectedAno]
  )

  const usedCatIds = budgets.map((b) => b.categoriaId)
  const totalLimit = budgets.reduce((s, b) => s + b.valorLimite, 0)
  const totalSpent = budgets.reduce((s, b) => s + (catTotals[b.categoriaId] || 0), 0)

  const handleSave = (data) => {
    if (editing) {
      budgetStore.update(editing.id, { valorLimite: data.valorLimite })
    } else {
      budgetStore.add({ ...data, casalId, mesRef: selectedMes, anoRef: selectedAno })
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id) => {
    if (await confirm('Excluir este orçamento?', 'Excluir')) budgetStore.remove(id)
  }

  const handleCopy = () => {
    try {
      const n = budgetStore.copyFromPreviousMonth(casalId, selectedMes, selectedAno)
      setCopyMsg(`${n} orçamento(s) copiado(s) do mês anterior.`)
      setTimeout(() => setCopyMsg(''), 4000)
    } catch (err) {
      setCopyMsg(err.message)
      setTimeout(() => setCopyMsg(''), 4000)
    }
  }

  const months = useMemo(() => {
    const list = []
    const base = new Date(now.getFullYear(), now.getMonth(), 1)
    for (let i = -2; i <= 2; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
      list.push({ mes: d.getMonth() + 1, ano: d.getFullYear() })
    }
    return list
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{monthName(selectedMes, selectedAno)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
            value={`${selectedAno}-${selectedMes}`}
            onChange={(e) => {
              const [a, m] = e.target.value.split('-')
              setSelectedAno(Number(a)); setSelectedMes(Number(m))
            }}
          >
            {months.map(({ mes, ano }) => (
              <option key={`${ano}-${mes}`} value={`${ano}-${mes}`} className="capitalize">
                {monthName(mes, ano)}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleCopy}><Copy size={14} /> Copiar mês anterior</Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> Novo orçamento</Button>
        </div>
      </div>

      {copyMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-2">
          {copyMsg}
        </div>
      )}

      {/* Summary */}
      {budgets.length > 0 && (
        <Card className="p-5">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total orçado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLimit)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Gasto até agora</p>
              <p className={`text-xl font-bold ${totalSpent > totalLimit ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} />
        </Card>
      )}

      {/* Budget list */}
      {budgets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400 text-sm">Nenhum orçamento para este mês</p>
          <div className="flex justify-center gap-2 mt-3">
            <Button onClick={() => { setEditing(null); setModalOpen(true) }} variant="secondary" size="sm">
              <Plus size={14} /> Criar orçamento
            </Button>
            <Button onClick={handleCopy} variant="secondary" size="sm">
              <Copy size={14} /> Copiar mês anterior
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoriaId)
            const spent = catTotals[b.categoriaId] || 0
            const pct = b.valorLimite > 0 ? (spent / b.valorLimite) * 100 : 0
            const isOver = pct >= 100
            const isAlert = pct >= 80 && pct < 100
            const remaining = b.valorLimite - spent

            return (
              <Card key={b.id} className={`p-4 ${isOver ? 'border-red-200' : isAlert ? 'border-yellow-200' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: (cat?.cor || '#6B7280') + '20' }}>
                      {cat?.icone || '📦'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{cat?.nome || 'Categoria'}</p>
                      <p className="text-xs text-gray-400">Limite: {formatCurrency(b.valorLimite)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1 mt-2 sm:mt-0">
                    {isOver && <Badge variant="red"><AlertTriangle size={10} /> Excedido</Badge>}
                    {isAlert && <Badge variant="yellow"><AlertTriangle size={10} /> Atenção</Badge>}
                    {!isOver && !isAlert && pct > 0 && <Badge variant="green"><CheckCircle size={10} /> OK</Badge>}
                    <button onClick={() => { setEditing(b); setModalOpen(true) }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors ml-1">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatCurrency(spent)}
                  </span>
                  <span className={`text-xs ${remaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} acima` : `${formatCurrency(remaining)} restante`}
                  </span>
                </div>
                <ProgressBar value={spent} max={b.valorLimite} />
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Editar orçamento' : 'Novo orçamento'}>
        <BudgetForm
          initial={editing ? { categoriaId: editing.categoriaId, valorLimite: String(editing.valorLimite) } : null}
          categories={categories}
          usedCatIds={usedCatIds}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      </Modal>
      {dialog}
    </div>
  )
}
