import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

// Clamps day to the last valid day of the given month (handles Feb 28/29 etc.)
function buildDate(year, month, day) {
  const lastDay = new Date(year, month, 0).getDate()
  const d = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export const usePlannedExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],

      forMonth: (casalId, mes, ano) =>
        get().expenses.filter((e) => {
          const d = new Date(e.dataVencimento + 'T00:00:00')
          return e.casalId === casalId && d.getMonth() + 1 === mes && d.getFullYear() === ano
        }),

      add: (data) => {
        const e = { id: uuidv4(), status: 'PENDENTE', recorrente: false, criadoEm: new Date().toISOString(), ...data }
        set((s) => ({ expenses: [...s.expenses, e] }))
        return e
      },

      // Creates one copy per month for `totalMonths` months starting from data.dataVencimento
      addRecurring: (data, totalMonths = 7) => {
        const recorrenciaId = uuidv4()
        const [year, month, day] = data.dataVencimento.split('-').map(Number)
        const copies = []
        for (let i = 0; i < totalMonths; i++) {
          const ref = new Date(year, month - 1 + i, 1)
          const y = ref.getFullYear()
          const m = ref.getMonth() + 1
          copies.push({
            id: uuidv4(),
            status: 'PENDENTE',
            recorrente: true,
            recorrenciaId,
            criadoEm: new Date().toISOString(),
            ...data,
            dataVencimento: buildDate(y, m, day),
          })
        }
        set((s) => ({ expenses: [...s.expenses, ...copies] }))
        return recorrenciaId
      },

      update: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, ...data } : e) })),

      remove: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      removeAllRecurring: (recorrenciaId) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.recorrenciaId !== recorrenciaId) })),

      markAsPaid: (id) =>
        set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, status: 'PAGO' } : e) })),

      revert: (id) =>
        set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, status: 'PENDENTE' } : e) })),

      cancel: (id) =>
        set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? { ...e, status: 'CANCELADO' } : e) })),
    }),
    { name: 'finwed_planned_expenses' }
  )
)
