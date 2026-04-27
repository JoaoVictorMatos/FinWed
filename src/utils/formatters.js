export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const formatDateInput = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}

export const currentMonthLabel = () => {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export const getMonthYear = (date = new Date()) => ({
  mes: date.getMonth() + 1,
  ano: date.getFullYear(),
})

export const isSameMonth = (dateStr, mes, ano) => {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  return d.getMonth() + 1 === mes && d.getFullYear() === ano
}

export const monthName = (mes, ano) =>
  new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const last6Months = () => {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ mes: d.getMonth() + 1, ano: d.getFullYear(), label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) })
  }
  return months
}
