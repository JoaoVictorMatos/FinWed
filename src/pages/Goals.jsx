import { useState, useMemo } from 'react'
import { Plus, Target, Archive, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useGoalStore } from '../store/useGoalStore'
import { formatCurrency, formatDateInput } from '../utils/formatters'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'

function GoalForm({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: '', descricao: '', valorAlvo: '', prazo: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome obrigatório.'); return }
    if (!form.valorAlvo || Number(form.valorAlvo) <= 0) { setError('Valor alvo inválido.'); return }
    onSave({ ...form, valorAlvo: Number(form.valorAlvo) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome da meta" placeholder="Ex: Viagem para Europa" value={form.nome} onChange={set('nome')} required />
      <Input label="Descrição (opcional)" placeholder="Detalhes sobre a meta..." value={form.descricao} onChange={set('descricao')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor alvo (R$)" type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valorAlvo} onChange={set('valorAlvo')} required />
        <Input label="Prazo (opcional)" type="date" value={form.prazo} onChange={set('prazo')} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">Criar meta</Button>
      </div>
    </form>
  )
}

function ContributionForm({ goal, onSave, onClose }) {
  const [form, setForm] = useState({ valor: '', descricao: '', dataAporte: formatDateInput(new Date()) })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const remaining = goal.valorAlvo - goal.valorAtual

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.valor || Number(form.valor) <= 0) { setError('Valor inválido.'); return }
    onSave(Number(form.valor), form.descricao, form.dataAporte)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary-50 rounded-xl p-4 text-center">
        <p className="text-sm text-primary-700 font-medium">{goal.nome}</p>
        <p className="text-xs text-primary-500 mt-1">Faltam {formatCurrency(remaining)} para concluir</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor do aporte (R$)" type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={set('valor')} required />
        <Input label="Data" type="date" value={form.dataAporte} onChange={set('dataAporte')} required />
      </div>
      <Input label="Descrição (opcional)" placeholder="Ex: Economia de março" value={form.descricao} onChange={set('descricao')} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">Registrar aporte</Button>
      </div>
    </form>
  )
}

function GoalCard({ goal, onContribute, onArchive, forecast }) {
  const pct = goal.valorAlvo > 0 ? (goal.valorAtual / goal.valorAlvo) * 100 : 0
  const remaining = goal.valorAlvo - goal.valorAtual
  const isNearDeadline = goal.prazo && new Date(goal.prazo) < new Date(Date.now() + 30 * 86400000)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Target size={18} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{goal.nome}</h3>
            {goal.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{goal.descricao}</p>}
          </div>
        </div>
        <button onClick={() => onArchive(goal.id)}
          className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Arquivar meta">
          <Archive size={14} />
        </button>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-sm">
          <span className="font-bold text-primary-700">{formatCurrency(goal.valorAtual)}</span>
          <span className="text-gray-400 text-xs">de {formatCurrency(goal.valorAlvo)}</span>
        </div>
        <ProgressBar value={goal.valorAtual} max={goal.valorAlvo} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {goal.prazo && (
          <Badge variant={isNearDeadline ? 'yellow' : 'gray'}>
            <Calendar size={10} /> {goal.prazo.split('-').reverse().join('/')}
          </Badge>
        )}
        {forecast && (
          <Badge variant="blue">
            <TrendingUp size={10} /> Previsão: {forecast}
          </Badge>
        )}
        {remaining > 0 && (
          <Badge variant="gray">Faltam {formatCurrency(remaining)}</Badge>
        )}
      </div>

      <Button onClick={() => onContribute(goal)} className="w-full" size="sm">
        <Plus size={14} /> Registrar aporte
      </Button>
    </Card>
  )
}

function CompletedGoalCard({ goal }) {
  return (
    <Card className="p-4 bg-green-50 border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <Sparkles size={16} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-900 text-sm truncate">{goal.nome}</p>
          <p className="text-xs text-green-600">{formatCurrency(goal.valorAlvo)} — Concluída!</p>
        </div>
        <Badge variant="green">✓ Concluída</Badge>
      </div>
    </Card>
  )
}

export default function Goals() {
  const { user, casal } = useAuthStore()
  const goalStore = useGoalStore()

  const casalId = casal?.id || user?.id
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [contribModal, setContribModal] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const active = useMemo(() => goalStore.forCouple(casalId), [goalStore.goals, casalId])
  const concluded = useMemo(
    () => goalStore.goals.filter((g) => g.casalId === casalId && g.status === 'CONCLUIDA'),
    [goalStore.goals, casalId]
  )
  const archived = useMemo(() => goalStore.archived(casalId).filter((g) => g.status === 'ARQUIVADA'), [goalStore.goals, casalId])

  const handleCreate = (data) => {
    goalStore.add({ ...data, casalId })
    setNewModalOpen(false)
  }

  const handleContrib = (valor, descricao, dataAporte) => {
    const done = goalStore.addContribution(contribModal.id, user.id, valor, descricao, dataAporte)
    setContribModal(null)
    if (done) {
      setSuccessMsg(`🎉 Meta "${contribModal.nome}" concluída! Parabéns!`)
      setTimeout(() => setSuccessMsg(''), 5000)
    }
  }

  const handleArchive = (id) => {
    if (confirm('Arquivar esta meta? Ela não aparecerá mais no dashboard.')) goalStore.archive(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas financeiras</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} meta{active.length !== 1 ? 's' : ''} ativa{active.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setNewModalOpen(true)}><Plus size={16} /> Nova meta</Button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Active goals */}
      {active.length === 0 ? (
        <Card className="p-12 text-center">
          <Target size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Nenhuma meta ativa</p>
          <p className="text-sm text-gray-400 mb-4">Crie metas para planejar objetivos financeiros juntos</p>
          <Button onClick={() => setNewModalOpen(true)} variant="secondary">
            <Plus size={14} /> Criar primeira meta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={setContribModal}
              onArchive={handleArchive}
              forecast={goalStore.forecastCompletion(g.id)}
            />
          ))}
        </div>
      )}

      {/* Concluded */}
      {concluded.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Concluídas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {concluded.map((g) => <CompletedGoalCard key={g.id} goal={g} />)}
          </div>
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
          >
            <Archive size={14} /> {showArchived ? 'Ocultar' : 'Ver'} {archived.length} meta{archived.length !== 1 ? 's' : ''} arquivada{archived.length !== 1 ? 's' : ''}
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {archived.map((g) => (
                <Card key={g.id} className="p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <Archive size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{g.nome}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(g.valorAtual)} / {formatCurrency(g.valorAlvo)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="Nova meta financeira">
        <GoalForm onSave={handleCreate} onClose={() => setNewModalOpen(false)} />
      </Modal>

      <Modal open={!!contribModal} onClose={() => setContribModal(null)} title="Registrar aporte">
        {contribModal && (
          <ContributionForm goal={contribModal} onSave={handleContrib} onClose={() => setContribModal(null)} />
        )}
      </Modal>
    </div>
  )
}
