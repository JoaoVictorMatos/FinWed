import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export const useBudgetStore = create(
  persist(
    (set, get) => ({
      budgets: [],

      forMonth: (casalId, mes, ano) =>
        get().budgets.filter((b) => b.casalId === casalId && b.mesRef === mes && b.anoRef === ano),

      add: (data) => {
        const existing = get().budgets.find(
          (b) => b.casalId === data.casalId && b.categoriaId === data.categoriaId &&
                 b.mesRef === data.mesRef && b.anoRef === data.anoRef
        )
        if (existing) throw new Error('Orçamento já existe para essa categoria neste mês.')
        const b = { id: uuidv4(), ...data }
        set((s) => ({ budgets: [...s.budgets, b] }))
        return b
      },

      update: (id, data) => {
        set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? { ...b, ...data } : b) }))
      },

      remove: (id) => {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }))
      },

      copyFromPreviousMonth: (casalId, mes, ano) => {
        const prevMes = mes === 1 ? 12 : mes - 1
        const prevAno = mes === 1 ? ano - 1 : ano
        const prev = get().forMonth(casalId, prevMes, prevAno)
        if (!prev.length) throw new Error('Nenhum orçamento encontrado no mês anterior.')
        const existing = get().forMonth(casalId, mes, ano).map((b) => b.categoriaId)
        const toAdd = prev
          .filter((b) => !existing.includes(b.categoriaId))
          .map((b) => ({ ...b, id: uuidv4(), mesRef: mes, anoRef: ano }))
        set((s) => ({ budgets: [...s.budgets, ...toAdd] }))
        return toAdd.length
      },
    }),
    { name: 'finwed_budgets' }
  )
)
