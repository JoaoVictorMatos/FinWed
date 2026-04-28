import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, CheckCircle2, RotateCcw, Pencil, Trash2,
  CalendarRange, AlertTriangle, XCircle, Clock, Repeat2,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { usePlannedExpenseStore } from '../store/usePlannedExpenseStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { useTransactionStore } from '../store/useTransactionStore'
import { formatCurrency, formatDateInput, monthName } from '../utils/formatters'
import { useConfirm } from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CurrencyInput from '../components/ui/CurrencyInput'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

// ─── helpers ──────────────────────────────────────────────────────────────────

const todayMidnight = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const isOverdue = (e) =>
  e.status === 'PENDENTE' && new Date(e.dataVencimento + 'T00:00:00') < todayMidnight()

const statusInfo = (e) => {
  if (e.status === 'PAGO')      return { label: 'Pago',      variant: 'green'  }
  if (e.status === 'CANCELADO') return { label: 'Cancelado', variant: 'gray'   }
  if (isOverdue(e))             return { label: 'Vencido',   variant: 'red'    }
  return                               { label: 'Pendente',  variant: 'yellow' }
}

// Gera range de 13 meses: 6 antes + atual + 6 depois
function buildMonthRange(baseDate) {
  const range = []
  for (let i = -6; i <= 6; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1)
    range.push({ mes: d.getMonth() + 1, ano: d.getFullYear() })
  }
  return range
}

function shortMonthLabel(mes, ano) {
  const d = new Date(ano, mes - 1, 1)
  const m = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${m}/${String(ano).slice(-2)}`
}

// ─── Month strip ──────────────────────────────────────────────────────────────

function MonthStrip({ months, selectedMes, selectedAno, currentMes, currentAno, onChange }) {
  const stripRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedMes, selectedAno])

  return (
    <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {months.map(({ mes, ano }) => {
        const isSelected = mes === selectedMes && ano === selectedAno
        const isCurrent  = mes === currentMes  && ano === currentAno
        return (
          <button
            key={`${ano}-${mes}`}
            ref={isSelected ? activeRef : null}
            onClick={() => onChange(mes, ano)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors border
              ${isSelected
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
          >
            <span className="capitalize">{shortMonthLabel(mes, ano)}</span>
            {isCurrent && (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function ExpenseForm({ initial, categories, defaultDate, onSave, onClose }) {
  const isEditing = !!initial
  const [form, setForm] = useState(
    initial
      ? { ...initial, valor: String(initial.valor), recorrente: false }
      : { descricao: '', valor: '', dataVencimento: defaultDate, categoriaId: '', observacao: '', recorrente: false }
  )
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.descricao.trim())                 { setError('Descrição obrigatória.'); return }
    if (!form.valor || Number(form.valor) <= 0) { setError('Valor inválido.'); return }
    if (!form.dataVencimento)                   { setError('Data obrigatória.'); return }
    if (!form.categoriaId)                      { setError('Selecione uma categoria.'); return }
    onSave({ ...form, valor: Number(form.valor) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Descrição" placeholder="Ex: Conta de luz" value={form.descricao} onChange={set('descricao')} required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CurrencyInput label="Valor (R$)" placeholder="0,00" value={form.valor} onChange={set('valor')} required />
        <Input label="Data de vencimento" type="date" value={form.dataVencimento} onChange={set('dataVencimento')} required />
      </div>
      <Select label="Categoria" value={form.categoriaId} onChange={set('categoriaId')}>
        <option value="">Selecione uma categoria...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
        ))}
      </Select>
      <div>
        <label className="form-label">Observação (opcional)</label>
        <textarea
          value={form.observacao}
          onChange={set('observacao')}
          placeholder="Detalhes adicionais..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
        />
      </div>

      {/* Recorrência — só na criação */}
      {!isEditing && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors
          ${form.recorrente ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
              <Repeat2 size={14} className={form.recorrente ? 'text-primary-600' : 'text-gray-400'} />
              Gasto recorrente
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {form.recorrente
                ? 'Será criado para este mês e os próximos 6 meses'
                : 'Repetir todo mês automaticamente'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, recorrente: !f.recorrente }))}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0
              ${form.recorrente ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
              ${form.recorrente ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">{isEditing ? 'Salvar alterações' : 'Adicionar gasto'}</Button>
      </div>
    </form>
  )
}

// ─── Delete recurring modal ───────────────────────────────────────────────────

function DeleteRecurringModal({ open, onClose, onDeleteOne, onDeleteAll }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-[300px]">
        <div className="flex flex-col items-center text-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <Repeat2 size={16} className="text-red-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Gasto recorrente</p>
          <p className="text-xs text-gray-500 leading-snug">Deseja excluir apenas este mês ou todos os meses desta recorrência?</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={onDeleteOne} className="w-full">Só este mês</Button>
          <Button variant="danger" size="sm" onClick={onDeleteAll} className="w-full">Todos os meses</Button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 pt-1">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({ expense, category, onPay, onRevert, onCancel, onEdit, onDelete }) {
  const { label, variant } = statusInfo(expense)
  const overdue = isOverdue(expense)
  const parts = expense.dataVencimento.split('-')
  const dayMonth = `${parts[2]}/${parts[1]}`

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 group transition-colors
      ${overdue ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'}
      ${expense.status === 'CANCELADO' ? 'opacity-50' : ''}`}>

      {/* Date pill */}
      <div className={`w-11 shrink-0 text-center rounded-lg py-1.5
        ${overdue ? 'bg-red-100' : expense.status === 'PAGO' ? 'bg-green-100' : 'bg-gray-100'}`}>
        <p className={`text-xs font-bold leading-tight
          ${overdue ? 'text-red-700' : expense.status === 'PAGO' ? 'text-green-700' : 'text-gray-700'}`}>
          {dayMonth.split('/')[0]}
        </p>
        <p className={`text-[10px] leading-tight
          ${overdue ? 'text-red-500' : expense.status === 'PAGO' ? 'text-green-500' : 'text-gray-400'}`}>
          {dayMonth.split('/')[1]}
        </p>
      </div>

      {/* Category icon */}
      {category ? (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: category.cor + '25' }}>
          {category.icone}
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-base">📋</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium truncate ${expense.status === 'CANCELADO' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {expense.descricao}
          </p>
          {expense.recorrente && (
            <Repeat2 size={11} className="text-primary-400 shrink-0" title="Gasto recorrente" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {category && <span className="text-xs text-gray-400">{category.nome}</span>}
          {expense.observacao && (
            <>
              {category && <span className="text-gray-300 text-xs">·</span>}
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{expense.observacao}</span>
            </>
          )}
        </div>
      </div>

      {/* Value + status */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${overdue ? 'text-red-600' : expense.status === 'PAGO' ? 'text-green-600' : 'text-gray-800'}`}>
          {formatCurrency(expense.valor)}
        </p>
        <Badge variant={variant} className="mt-0.5">{label}</Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {expense.status === 'PENDENTE' && (
          <>
            <button onClick={() => onPay(expense.id)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar como pago">
              <CheckCircle2 size={15} />
            </button>
            <button onClick={() => onEdit(expense)}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Editar">
              <Pencil size={14} />
            </button>
            <button onClick={() => onCancel(expense.id)}
              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="Cancelar">
              <XCircle size={14} />
            </button>
          </>
        )}
        {(expense.status === 'PAGO' || expense.status === 'CANCELADO') && (
          <button onClick={() => onRevert(expense.id)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Reverter para pendente">
            <RotateCcw size={14} />
          </button>
        )}
        <button onClick={() => onDelete(expense)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Excluir">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlannedExpenses() {
  const { user, casal } = useAuthStore()
  const store = usePlannedExpenseStore()
  const txStore = useTransactionStore()
  const catStore = useCategoryStore()
  const { confirm, dialog } = useConfirm()

  const casalId = casal?.id || user?.id
  const now = new Date()
  const currentMes = now.getMonth() + 1
  const currentAno = now.getFullYear()

  const [mes, setMes] = useState(currentMes)
  const [ano, setAno] = useState(currentAno)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // expense to delete (if recurring)

  const months = useMemo(() => buildMonthRange(now), [])
  const categories = useMemo(() => catStore.all(casalId), [catStore.custom, casalId])

  const expenses = useMemo(
    () => store.forMonth(casalId, mes, ano).sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
    [store.expenses, casalId, mes, ano]
  )

  const summary = useMemo(() => {
    const active = expenses.filter((e) => e.status !== 'CANCELADO')
    return {
      total:    active.reduce((s, e) => s + e.valor, 0),
      pago:     active.filter((e) => e.status === 'PAGO').reduce((s, e) => s + e.valor, 0),
      pendente: active.filter((e) => e.status === 'PENDENTE').reduce((s, e) => s + e.valor, 0),
      vencidos: active.filter(isOverdue).length,
    }
  }, [expenses])

  const isPastMonth = new Date(ano, mes - 1, 1) < new Date(currentAno, currentMes - 1, 1)
  const isCurrentMonth = mes === currentMes && ano === currentAno

  const defaultDate = useMemo(() => {
    if (isCurrentMonth) return formatDateInput(now)
    return `${ano}-${String(mes).padStart(2, '0')}-01`
  }, [mes, ano, isCurrentMonth])

  const pctPago = summary.total > 0 ? (summary.pago / summary.total) * 100 : 0

  // ── handlers ──

  const handleSave = (data) => {
    if (editing) {
      store.update(editing.id, data)
    } else if (data.recorrente) {
      store.addRecurring({ ...data, casalId }, 7)
    } else {
      store.add({ ...data, casalId })
    }
    setModalOpen(false)
    setEditing(null)
  }

  const openEdit = (expense) => { setEditing(expense); setModalOpen(true) }
  const openNew  = () => { setEditing(null); setModalOpen(true) }

  const handlePay = (id) => {
    const expense = store.expenses.find((e) => e.id === id)
    if (!expense) return
    store.markAsPaid(id)
    txStore.add({
      tipo: 'DESPESA',
      escopo: 'PESSOAL',
      valor: expense.valor,
      descricao: expense.descricao,
      categoriaId: expense.categoriaId,
      dataTransacao: expense.dataVencimento,
      casalId,
      criadoPor: user.id,
    })
  }

  const handleRevert = (id) => store.revert(id)

  const handleCancel = async (id) => {
    if (await confirm('Cancelar este gasto planejado?', 'Cancelar')) store.cancel(id)
  }

  const handleDelete = (expense) => {
    if (expense.recorrente && expense.recorrenciaId) {
      setDeleteTarget(expense)
    } else {
      confirm('Excluir este gasto permanentemente?', 'Excluir').then((ok) => {
        if (ok) store.remove(expense.id)
      })
    }
  }

  const confirmDeleteOne = () => {
    store.remove(deleteTarget.id)
    setDeleteTarget(null)
  }
  const confirmDeleteAll = () => {
    store.removeAllRecurring(deleteTarget.recorrenciaId)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos planejados</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {expenses.filter((e) => e.status !== 'CANCELADO').length} gasto(s) em {monthName(mes, ano)}
          </p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Novo gasto</Button>
      </div>

      {/* Month strip */}
      <MonthStrip
        months={months}
        selectedMes={mes}
        selectedAno={ano}
        currentMes={currentMes}
        currentAno={currentAno}
        onChange={(m, a) => { setMes(m); setAno(a) }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total planejado</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(summary.total)}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {expenses.filter((e) => e.status !== 'CANCELADO').length} item(s)
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Pago</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(summary.pago)}</p>
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pctPago}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">A pagar</p>
          <p className={`text-sm font-bold ${summary.vencidos > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(summary.pendente)}
          </p>
          {summary.vencidos > 0 && (
            <p className="text-[10px] text-red-500 mt-1 font-medium">{summary.vencidos} vencido(s)</p>
          )}
        </Card>
      </div>

      {/* Overdue alert */}
      {summary.vencidos > 0 && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {summary.vencidos} gasto{summary.vencidos > 1 ? 's' : ''} vencido{summary.vencidos > 1 ? 's' : ''} e ainda não {summary.vencidos > 1 ? 'foram pagos' : 'foi pago'}.
          </p>
        </div>
      )}

      {/* List */}
      {expenses.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarRange size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">
            {isPastMonth ? 'Nenhum gasto registrado neste mês' : 'Nenhum gasto planejado'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {isPastMonth
              ? 'Não há registros para este período.'
              : 'Adicione gastos para planejar suas finanças com antecedência.'}
          </p>
          <Button variant="secondary" onClick={openNew}>
            <Plus size={14} /> Adicionar gasto
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Lançamentos</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              {expenses.some((e) => e.status === 'PAGO') && (
                <Badge variant="green">
                  <CheckCircle2 size={10} />
                  {expenses.filter((e) => e.status === 'PAGO').length} pago(s)
                </Badge>
              )}
              {expenses.some(isOverdue) && (
                <Badge variant="red">
                  <AlertTriangle size={10} />
                  {expenses.filter(isOverdue).length} vencido(s)
                </Badge>
              )}
              {expenses.some((e) => e.recorrente) && (
                <Badge variant="blue">
                  <Repeat2 size={10} />
                  {expenses.filter((e) => e.recorrente).length} recorrente(s)
                </Badge>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                category={categories.find((c) => c.id === expense.categoriaId) || null}
                onPay={handlePay}
                onRevert={handleRevert}
                onCancel={handleCancel}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </Card>
      )}

      {isPastMonth && expenses.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          Mês encerrado — você ainda pode adicionar ou editar registros históricos.
        </div>
      )}

      {/* Modals */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Editar gasto' : 'Novo gasto planejado'}
      >
        <ExpenseForm
          initial={editing}
          categories={categories}
          defaultDate={defaultDate}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      </Modal>

      <DeleteRecurringModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleteOne={confirmDeleteOne}
        onDeleteAll={confirmDeleteAll}
      />

      {dialog}
    </div>
  )
}
