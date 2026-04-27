import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const USERS_KEY = 'finwed_users'
const INVITES_KEY = 'finwed_invites'
const COUPLES_KEY = 'finwed_couples'

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users))
const getInvites = () => JSON.parse(localStorage.getItem(INVITES_KEY) || '[]')
const saveInvites = (inv) => localStorage.setItem(INVITES_KEY, JSON.stringify(inv))
const getCouples = () => JSON.parse(localStorage.getItem(COUPLES_KEY) || '[]')
const saveCouples = (c) => localStorage.setItem(COUPLES_KEY, JSON.stringify(c))

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      casal: null,
      partner: null,
      pendingInvite: null,

      register: (nome, email, senha) => {
        const users = getUsers()
        if (users.find((u) => u.email === email)) {
          throw new Error('E-mail já cadastrado.')
        }
        const user = { id: uuidv4(), nome, email, senha, avatarUrl: '', casalId: null, criadoEm: new Date().toISOString() }
        saveUsers([...users, user])

        // Check if there's a pending invite for this email
        const invites = getInvites()
        const invite = invites.find((i) => i.emailConvidado === email && !i.aceito)
        set({ user, pendingInvite: invite || null })
        return user
      },

      login: (email, senha) => {
        const users = getUsers()
        const user = users.find((u) => u.email === email && u.senha === senha)
        if (!user) throw new Error('E-mail ou senha inválidos.')

        let casal = null
        let partner = null
        if (user.casalId) {
          const couples = getCouples()
          casal = couples.find((c) => c.id === user.casalId) || null
          if (casal) {
            const partnerId = casal.parceiroA === user.id ? casal.parceiroB : casal.parceiroA
            partner = users.find((u) => u.id === partnerId) || null
          }
        }

        const invites = getInvites()
        const invite = invites.find((i) => i.emailConvidado === email && !i.aceito)
        set({ user, casal, partner, pendingInvite: invite || null })
        return user
      },

      logout: () => set({ user: null, casal: null, partner: null, pendingInvite: null }),

      updateProfile: (data) => {
        const users = getUsers()
        const updated = users.map((u) => u.id === get().user.id ? { ...u, ...data } : u)
        saveUsers(updated)
        set({ user: { ...get().user, ...data } })
      },

      sendInvite: (emailConvidado) => {
        const { user } = get()
        if (!user) throw new Error('Não autenticado.')
        if (emailConvidado === user.email) throw new Error('Você não pode se convidar.')
        const invites = getInvites()
        const existing = invites.find((i) => i.emailConvidado === emailConvidado && !i.aceito)
        if (existing) throw new Error('Convite já enviado para este e-mail.')
        const invite = {
          id: uuidv4(),
          remetenteId: user.id,
          remetenteNome: user.nome,
          emailConvidado,
          token: uuidv4(),
          aceito: false,
          criadoEm: new Date().toISOString(),
        }
        saveInvites([...invites, invite])
        return invite
      },

      acceptInvite: () => {
        const { user, pendingInvite } = get()
        if (!user || !pendingInvite) throw new Error('Sem convite pendente.')

        const users = getUsers()
        const remitente = users.find((u) => u.id === pendingInvite.remetenteId)
        if (!remitente) throw new Error('Usuário remetente não encontrado.')

        const casal = {
          id: uuidv4(),
          parceiroA: pendingInvite.remetenteId,
          parceiroB: user.id,
          criadoEm: new Date().toISOString(),
        }
        const couples = getCouples()
        saveCouples([...couples, casal])

        const updatedUsers = users.map((u) => {
          if (u.id === user.id || u.id === remitente.id) return { ...u, casalId: casal.id }
          return u
        })
        saveUsers(updatedUsers)

        const invites = getInvites()
        saveInvites(invites.map((i) => i.id === pendingInvite.id ? { ...i, aceito: true } : i))

        const updatedUser = { ...user, casalId: casal.id }
        set({ user: updatedUser, casal, partner: remitente, pendingInvite: null })
      },

      rejectInvite: () => {
        const { pendingInvite } = get()
        if (!pendingInvite) return
        const invites = getInvites()
        saveInvites(invites.map((i) => i.id === pendingInvite.id ? { ...i, aceito: true } : i))
        set({ pendingInvite: null })
      },

      dissolveCouple: () => {
        const { user, casal } = get()
        if (!casal) return
        const couples = getCouples()
        saveCouples(couples.filter((c) => c.id !== casal.id))
        const users = getUsers()
        saveUsers(users.map((u) =>
          u.id === casal.parceiroA || u.id === casal.parceiroB ? { ...u, casalId: null } : u
        ))
        set({ user: { ...user, casalId: null }, casal: null, partner: null })
      },
    }),
    { name: 'finwed_session', partialize: (s) => ({ user: s.user, casal: s.casal, partner: s.partner }) }
  )
)
