import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: [],
      contributions: [],

      forCouple: (casalId) =>
        get().goals.filter((g) => g.casalId === casalId && g.status === 'ATIVA'),

      archived: (casalId) =>
        get().goals.filter((g) => g.casalId === casalId && g.status !== 'ATIVA'),

      add: (data) => {
        const g = { id: uuidv4(), valorAtual: 0, status: 'ATIVA', criadoEm: new Date().toISOString(), ...data }
        set((s) => ({ goals: [...s.goals, g] }))
        return g
      },

      update: (id, data) => {
        set((s) => ({ goals: s.goals.map((g) => g.id === id ? { ...g, ...data } : g) }))
      },

      archive: (id) => {
        set((s) => ({ goals: s.goals.map((g) => g.id === id ? { ...g, status: 'ARQUIVADA' } : g) }))
      },

      addContribution: (metaId, usuarioId, valor, descricao, dataAporte) => {
        const goal = get().goals.find((g) => g.id === metaId)
        if (!goal) throw new Error('Meta não encontrada.')
        const aporte = { id: uuidv4(), metaId, usuarioId, valor: Number(valor), descricao, dataAporte, criadoEm: new Date().toISOString() }
        const novoValor = goal.valorAtual + Number(valor)
        const concluida = novoValor >= goal.valorAlvo
        set((s) => ({
          contributions: [...s.contributions, aporte],
          goals: s.goals.map((g) =>
            g.id === metaId
              ? { ...g, valorAtual: novoValor, status: concluida ? 'CONCLUIDA' : 'ATIVA' }
              : g
          ),
        }))
        return concluida
      },

      contributionsForGoal: (metaId) => get().contributions.filter((c) => c.metaId === metaId),

      removeContribution: (id) => {
        const contrib = get().contributions.find((c) => c.id === id)
        if (!contrib) return
        const goal = get().goals.find((g) => g.id === contrib.metaId)
        if (!goal) return
        const novoValor = Math.max(0, goal.valorAtual - contrib.valor)
        set((s) => ({
          contributions: s.contributions.filter((c) => c.id !== id),
          goals: s.goals.map((g) =>
            g.id === contrib.metaId
              ? { ...g, valorAtual: novoValor, status: g.status === 'ARQUIVADA' ? 'ARQUIVADA' : novoValor >= g.valorAlvo ? 'CONCLUIDA' : 'ATIVA' }
              : g
          ),
        }))
      },

      forecastCompletion: (metaId) => {
        const goal = get().goals.find((g) => g.id === metaId)
        if (!goal || goal.valorAtual <= 0) return null
        const contribs = get().contributionsForGoal(metaId)
        if (contribs.length < 2) return null
        const sorted = [...contribs].sort((a, b) => a.dataAporte.localeCompare(b.dataAporte))
        const first = new Date(sorted[0].dataAporte + 'T00:00:00')
        const last = new Date(sorted[sorted.length - 1].dataAporte + 'T00:00:00')
        const daysDiff = (last - first) / 86400000 || 1
        const ratePerDay = goal.valorAtual / daysDiff
        const remaining = goal.valorAlvo - goal.valorAtual
        const daysLeft = remaining / ratePerDay
        const forecast = new Date(last.getTime() + daysLeft * 86400000)
        return forecast.toLocaleDateString('pt-BR')
      },
    }),
    { name: 'finwed_goals' }
  )
)
