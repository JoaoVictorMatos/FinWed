import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight, AlertTriangle, CheckCircle2, XCircle, RotateCcw, CalendarRange, Repeat2 } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useAuthStore } from '../store/useAuthStore'
import { useTransactionStore } from '../store/useTransactionStore'
import { useBudgetStore } from '../store/useBudgetStore'
import { useGoalStore } from '../store/useGoalStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { usePlannedExpenseStore } from '../store/usePlannedExpenseStore'
import { formatCurrency, getMonthYear, currentMonthLabel, last6Months, isSameMonth } from '../utils/formatters'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>
}

const isOverdue = (e) => {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  return e.status === 'PENDENTE' && new Date(e.dataVencimento + 'T00:00:00') < d
}

export default function Dashboard() {
  const { user, casal } = useAuthStore()
  const txStore = useTransactionStore()
  const budgetStore = useBudgetStore()
  const goalStore = useGoalStore()
  const catStore = useCategoryStore()
  const plannedStore = usePlannedExpenseStore()

  const { mes, ano } = getMonthYear()
  const casalId = casal?.id || user?.id

  const { receitas, despesas, saldo, txs } = useMemo(
    () => txStore.summaryForMonth(casalId, user?.id, mes, ano),
    [txStore.transactions, casalId, user?.id, mes, ano]
  )

  const catTotals = useMemo(
    () => txStore.byCategory(casalId, user?.id, mes, ano),
    [txStore.transactions, casalId, user?.id, mes, ano]
  )

  const categories = useMemo(() => catStore.all(casalId), [catStore.custom, casalId])

  const pieData = useMemo(() =>
    Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id)
        return { name: cat?.nome || 'Outros', value, fill: cat?.cor || '#6B7280' }
      })
      .sort((a, b) => b.value - a.value)
  , [catTotals, categories])

  const months = useMemo(() => last6Months(), [])
  const evolutionData = useMemo(
    () => txStore.monthlyEvolution(casalId, user?.id, months),
    [txStore.transactions, casalId, user?.id]
  )

  const budgets = useMemo(() => budgetStore.forMonth(casalId, mes, ano), [budgetStore.budgets, casalId, mes, ano])
  const alertBudgets = budgets.filter((b) => {
    const spent = catTotals[b.categoriaId] || 0
    return spent >= b.valorLimite * 0.8
  })

  const goals = useMemo(() => goalStore.forCouple(casalId), [goalStore.goals, casalId])
  const recentTxs = txs.slice(0, 5)

  const plannedExpenses = useMemo(
    () => plannedStore.forMonth(casalId, mes, ano)
      .filter((e) => e.status !== 'CANCELADO')
      .sort((a, b) => {
        const aOver = isOverdue(a) ? 0 : 1
        const bOver = isOverdue(b) ? 0 : 1
        if (aOver !== bOver) return aOver - bOver
        return a.dataVencimento.localeCompare(b.dataVencimento)
      }),
    [plannedStore.expenses, casalId, mes, ano]
  )

  const plannedSummary = useMemo(() => ({
    pendente: plannedExpenses.filter((e) => e.status === 'PENDENTE').reduce((s, e) => s + e.valor, 0),
    vencidos: plannedExpenses.filter(isOverdue).length,
    total: plannedExpenses.length,
  }), [plannedExpenses])

  const handlePlannedPay = (id) => {
    const expense = plannedStore.expenses.find((e) => e.id === id)
    if (!expense) return
    plannedStore.markAsPaid(id)
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

  const handlePlannedCancel = (id) => plannedStore.cancel(id)
  const handlePlannedRevert = (id) => plannedStore.revert(id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{currentMonthLabel()}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Saldo do mês" value={formatCurrency(saldo)} icon={Wallet}
          color={saldo >= 0 ? 'bg-primary-600' : 'bg-red-500'}
          sub={saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'} />
        <StatCard label="Receitas" value={formatCurrency(receitas)} icon={TrendingUp} color="bg-green-500" />
        <StatCard label="Despesas" value={formatCurrency(despesas)} icon={TrendingDown} color="bg-red-500" />
      </div>

      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
            <AlertTriangle size={16} />
            {alertBudgets.length} orçamento{alertBudgets.length > 1 ? 's' : ''} com alerta este mês
          </div>
          <div className="flex flex-wrap gap-2">
            {alertBudgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoriaId)
              const spent = catTotals[b.categoriaId] || 0
              const over = spent >= b.valorLimite
              return (
                <Badge key={b.id} variant={over ? 'red' : 'yellow'}>
                  {cat?.icone} {cat?.nome}: {formatCurrency(spent)} / {formatCurrency(b.valorLimite)}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Despesas por categoria</h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem despesas este mês</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={renderCustomLabel}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Evolução — últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={45} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Últimas transações</h2>
            <Link to="/transacoes" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {recentTxs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma transação este mês</p>
          ) : (
            <ul className="space-y-2">
              {recentTxs.map((t) => {
                const cat = categories.find((c) => c.id === t.categoriaId)
                return (
                  <li key={t.id} className="flex items-center gap-3 py-1">
                    <span className="text-xl w-8 text-center">{cat?.icone || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.descricao || cat?.nome}</p>
                      <p className="text-xs text-gray-400">{t.dataTransacao?.split('-').reverse().join('/')} · {t.escopo === 'COMPARTILHADA' ? '👫' : '👤'}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.tipo === 'RECEITA' ? '+' : '-'}{formatCurrency(t.valor)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Goals summary */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Metas ativas</h2>
            <Link to="/metas" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma meta ativa</p>
          ) : (
            <ul className="space-y-3">
              {goals.slice(0, 4).map((g) => {
                const pct = g.valorAlvo > 0 ? (g.valorAtual / g.valorAlvo) * 100 : 0
                return (
                  <li key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 truncate">{g.nome}</span>
                      <span className="text-gray-500 text-xs ml-2 shrink-0">{formatCurrency(g.valorAtual)} / {formatCurrency(g.valorAlvo)}</span>
                    </div>
                    <ProgressBar value={g.valorAtual} max={g.valorAlvo} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Planned expenses widget */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarRange size={16} className="text-primary-600" />
            <h2 className="text-sm font-semibold text-gray-700">Gastos planejados — este mês</h2>
          </div>
          <div className="flex items-center gap-3">
            {plannedSummary.vencidos > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle size={12} />
                {plannedSummary.vencidos} vencido{plannedSummary.vencidos > 1 ? 's' : ''}
              </span>
            )}
            {plannedSummary.pendente > 0 && (
              <span className="text-xs text-gray-500">
                {formatCurrency(plannedSummary.pendente)} a pagar
              </span>
            )}
            <Link to="/gastos" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* List */}
        {plannedExpenses.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
            <CalendarRange size={32} className="text-gray-200" />
            <p className="text-sm">Nenhum gasto planejado para este mês</p>
            <Link to="/gastos" className="text-xs text-primary-600 hover:underline mt-1">Adicionar gasto</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {plannedExpenses.slice(0, 6).map((expense) => {
              const cat = categories.find((c) => c.id === expense.categoriaId)
              const overdue = isOverdue(expense)
              const parts = expense.dataVencimento.split('-')
              const dayMonth = `${parts[2]}/${parts[1]}`

              return (
                <div
                  key={expense.id}
                  className={`flex items-center gap-3 px-5 py-3.5 group transition-colors
                    ${overdue ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}
                    ${expense.status === 'PAGO' ? 'opacity-70' : ''}`}
                >
                  {/* Date pill */}
                  <div className={`w-10 shrink-0 text-center rounded-lg py-1
                    ${overdue ? 'bg-red-100' : expense.status === 'PAGO' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold leading-tight
                      ${overdue ? 'text-red-700' : expense.status === 'PAGO' ? 'text-green-700' : 'text-gray-700'}`}>
                      {dayMonth.split('/')[0]}
                    </p>
                    <p className={`text-[10px] leading-tight
                      ${overdue ? 'text-red-400' : expense.status === 'PAGO' ? 'text-green-400' : 'text-gray-400'}`}>
                      {dayMonth.split('/')[1]}
                    </p>
                  </div>

                  {/* Category icon */}
                  {cat ? (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: cat.cor + '25' }}>
                      {cat.icone}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-sm">📋</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${expense.status === 'PAGO' ? 'text-gray-500' : 'text-gray-900'}`}>
                        {expense.descricao}
                      </p>
                      {expense.recorrente && <Repeat2 size={11} className="text-primary-400 shrink-0" />}
                    </div>
                    {cat && <p className="text-xs text-gray-400 truncate">{cat.nome}</p>}
                  </div>

                  {/* Value + status */}
                  <div className="text-right shrink-0 mr-1">
                    <p className={`text-sm font-bold ${overdue ? 'text-red-600' : expense.status === 'PAGO' ? 'text-green-600' : 'text-gray-800'}`}>
                      {formatCurrency(expense.valor)}
                    </p>
                    <Badge variant={expense.status === 'PAGO' ? 'green' : overdue ? 'red' : 'yellow'} className="mt-0.5">
                      {expense.status === 'PAGO' ? 'Pago' : overdue ? 'Vencido' : 'Pendente'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {expense.status === 'PENDENTE' && (
                      <>
                        <button
                          onClick={() => handlePlannedPay(expense.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como pago"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        <button
                          onClick={() => handlePlannedCancel(expense.id)}
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    {expense.status === 'PAGO' && (
                      <button
                        onClick={() => handlePlannedRevert(expense.id)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Reverter para pendente"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {plannedExpenses.length > 6 && (
              <div className="px-5 py-3 text-center">
                <Link to="/gastos" className="text-xs text-primary-600 hover:underline">
                  + {plannedExpenses.length - 6} gasto{plannedExpenses.length - 6 > 1 ? 's' : ''} — ver todos
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
