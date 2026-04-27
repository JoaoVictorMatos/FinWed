import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { defaultCategories } from '../data/defaultCategories'

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      custom: [],

      all: (casalId) => {
        const custom = get().custom.filter((c) => c.casalId === casalId && c.ativo)
        return [...defaultCategories, ...custom]
      },

      byId: (id) => {
        const all = [...defaultCategories, ...get().custom]
        return all.find((c) => c.id === id) || null
      },

      add: (casalId, data) => {
        const cat = { id: uuidv4(), casalId, ativo: true, ...data }
        set((s) => ({ custom: [...s.custom, cat] }))
        return cat
      },

      remove: (id) => {
        set((s) => ({ custom: s.custom.map((c) => c.id === id ? { ...c, ativo: false } : c) }))
      },
    }),
    { name: 'finwed_categories' }
  )
)
