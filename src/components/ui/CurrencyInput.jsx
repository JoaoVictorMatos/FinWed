import React from 'react'
import Input from './Input'

export default function CurrencyInput({ value, onChange, ...props }) {
  const format = (val) => {
    if (val === undefined || val === null || val === '') return ''
    const num = Number(val)
    if (isNaN(num)) return ''
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) {
      if (onChange) onChange({ target: { value: '' } })
      return
    }
    const num = parseInt(val, 10) / 100
    if (onChange) onChange({ target: { value: num.toString() } })
  }

  return (
    <Input
      {...props}
      type="text"
      value={format(value)}
      onChange={handleChange}
    />
  )
}
