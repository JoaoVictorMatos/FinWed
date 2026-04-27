import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight, AlertTriangle } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useAuthStore } from '../store/useAuthStore'
import { useTransactionStore } from '../store/useTransactionStore'
import { useBudgetStore } from '../store/useBudgetStore'
import { useGoalStore } from '../store/useGoalStore'
import { useCategoryStore } from '../store/useCategoryStore'
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

export default function Dashboard() {
  const { user, casal } = useAuthStore()
  const txStore = useTransactionStore()
  const budgetStore = useBudgetStore()
  const goalStore = useGoalStore()
  const catStore = useCategoryStore()

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
    </div>
  )
}
