import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export const useTransactionStore = create(
  persist(
    (set, get) => ({
      transactions: [],

      forCouple: (casalId, userId) =>
        get().transactions.filter((t) => {
          if (t.casalId !== casalId) return false
          if (t.escopo === 'PESSOAL' && t.criadoPor !== userId) return false
          return true
        }),

      add: (data) => {
        const t = { id: uuidv4(), criadoEm: new Date().toISOString(), ...data }
        if (t.escopo === 'COMPARTILHADA') {
          const total = (Number(t.divisaoA) || 0) + (Number(t.divisaoB) || 0)
          if (Math.abs(total - 100) > 0.01) throw new Error('A divisão deve somar 100%.')
        }
        set((s) => ({ transactions: [t, ...s.transactions] }))
        return t
      },

      update: (id, data) => {
        set((s) => ({
          transactions: s.transactions.map((t) => t.id === id ? { ...t, ...data } : t),
        }))
      },

      remove: (id) => {
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
      },

      summaryForMonth: (casalId, userId, mes, ano) => {
        const txs = get().forCouple(casalId, userId).filter((t) => {
          const d = new Date(t.dataTransacao + 'T00:00:00')
          return d.getMonth() + 1 === mes && d.getFullYear() === ano
        })
        const receitas = txs.filter((t) => t.tipo === 'RECEITA').reduce((s, t) => s + Number(t.valor), 0)
        const despesas = txs.filter((t) => t.tipo === 'DESPESA').reduce((s, t) => s + Number(t.valor), 0)
        return { receitas, despesas, saldo: receitas - despesas, txs }
      },

      byCategory: (casalId, userId, mes, ano) => {
        const { txs } = get().summaryForMonth(casalId, userId, mes, ano)
        const map = {}
        txs.filter((t) => t.tipo === 'DESPESA').forEach((t) => {
          map[t.categoriaId] = (map[t.categoriaId] || 0) + Number(t.valor)
        })
        return map
      },

      monthlyEvolution: (casalId, userId, months) =>
        months.map(({ mes, ano, label }) => {
          const { receitas, despesas } = get().summaryForMonth(casalId, userId, mes, ano)
          return { label, receitas, despesas }
        }),
    }),
    { name: 'finwed_transactions' }
  )
)
