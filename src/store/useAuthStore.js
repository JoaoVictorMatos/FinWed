import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const USERS_KEY   = 'finwed_users'
const INVITES_KEY = 'finwed_invites'
const COUPLES_KEY = 'finwed_couples'

const getUsers   = () => JSON.parse(localStorage.getItem(USERS_KEY)   || '[]')
const saveUsers  = (u) => localStorage.setItem(USERS_KEY,   JSON.stringify(u))
const getInvites = () => JSON.parse(localStorage.getItem(INVITES_KEY) || '[]')
const saveInvites= (i) => localStorage.setItem(INVITES_KEY, JSON.stringify(i))
const getCouples = () => JSON.parse(localStorage.getItem(COUPLES_KEY) || '[]')
const saveCouples= (c) => localStorage.setItem(COUPLES_KEY, JSON.stringify(c))

// SHA-256 via Web Crypto API (async, browser-native)
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'finwed_v1')
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const isHash = (s) => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s)

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      casal: null,
      partner: null,
      pendingInvite: null,

      register: async (nome, email, senha) => {
        const users = getUsers()
        if (users.find((u) => u.email === email)) {
          throw new Error('E-mail já cadastrado.')
        }
        const hash = await hashPassword(senha)
        const user = {
          id: uuidv4(), nome, email,
          senha: hash,
          avatarUrl: '', casalId: null,
          criadoEm: new Date().toISOString(),
        }
        saveUsers([...users, user])

        const invites = getInvites()
        const invite = invites.find((i) => i.emailConvidado === email && !i.aceito)
        set({ user, pendingInvite: invite || null })
        return user
      },

      login: async (email, senha) => {
        const hash  = await hashPassword(senha)
        const users = getUsers()

        let user = users.find((u) => u.email === email && u.senha === hash)

        // Migration: plaintext passwords from before hashing was introduced
        if (!user) {
          const legacy = users.find((u) => u.email === email && !isHash(u.senha) && u.senha === senha)
          if (legacy) {
            const migrated = users.map((u) => u.id === legacy.id ? { ...u, senha: hash } : u)
            saveUsers(migrated)
            user = { ...legacy, senha: hash }
          }
        }

        if (!user) throw new Error('E-mail ou senha inválidos.')

        let casal   = null
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
        const invite  = invites.find((i) => i.emailConvidado === email && !i.aceito)
        set({ user, casal, partner, pendingInvite: invite || null })
        return user
      },

      logout: () => set({ user: null, casal: null, partner: null, pendingInvite: null }),

      updateProfile: (data) => {
        const users   = getUsers()
        const updated = users.map((u) => u.id === get().user.id ? { ...u, ...data } : u)
        saveUsers(updated)
        set({ user: { ...get().user, ...data } })
      },

      sendInvite: (emailConvidado) => {
        const { user } = get()
        if (!user) throw new Error('Não autenticado.')
        if (emailConvidado === user.email) throw new Error('Você não pode se convidar.')
        const invites  = getInvites()
        const existing = invites.find((i) => i.emailConvidado === emailConvidado && !i.aceito)
        if (existing) throw new Error('Convite já enviado para este e-mail.')
        const invite = {
          id: uuidv4(),
          remetenteId:   user.id,
          remetenteNome: user.nome,
          emailConvidado,
          token:    uuidv4(),
          aceito:   false,
          criadoEm: new Date().toISOString(),
        }
        saveInvites([...invites, invite])
        return invite
      },

      acceptInvite: () => {
        const { user, pendingInvite } = get()
        if (!user || !pendingInvite) throw new Error('Sem convite pendente.')

        const users     = getUsers()
        const remetente = users.find((u) => u.id === pendingInvite.remetenteId)
        if (!remetente) throw new Error('Usuário remetente não encontrado.')

        const casal = {
          id: uuidv4(),
          parceiroA: pendingInvite.remetenteId,
          parceiroB: user.id,
          criadoEm: new Date().toISOString(),
        }
        saveCouples([...getCouples(), casal])

        const updatedUsers = users.map((u) =>
          u.id === user.id || u.id === remetente.id ? { ...u, casalId: casal.id } : u
        )
        saveUsers(updatedUsers)
        saveInvites(getInvites().map((i) => i.id === pendingInvite.id ? { ...i, aceito: true } : i))

        set({ user: { ...user, casalId: casal.id }, casal, partner: remetente, pendingInvite: null })
      },

      rejectInvite: () => {
        const { pendingInvite } = get()
        if (!pendingInvite) return
        saveInvites(getInvites().map((i) => i.id === pendingInvite.id ? { ...i, aceito: true } : i))
        set({ pendingInvite: null })
      },

      dissolveCouple: () => {
        const { user, casal } = get()
        if (!casal) return
        saveCouples(getCouples().filter((c) => c.id !== casal.id))
        saveUsers(getUsers().map((u) =>
          u.id === casal.parceiroA || u.id === casal.parceiroB ? { ...u, casalId: null } : u
        ))
        set({ user: { ...user, casalId: null }, casal: null, partner: null })
      },

      autoLoginDev: () => {
        const users = getUsers()
        let user = users[0]
        if (!user) {
          user = {
            id: uuidv4(), nome: 'Usuário Local', email: 'local@local.com',
            senha: 'bypass_login', avatarUrl: '', casalId: null, criadoEm: new Date().toISOString()
          }
          saveUsers([user])
        }

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
        set({ user, casal, partner, pendingInvite: null })
      },
    }),
    { name: 'finwed_session', partialize: (s) => ({ user: s.user, casal: s.casal, partner: s.partner }) }
  )
)
