import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-[272px]">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-700 leading-snug">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', confirmLabel: 'Confirmar', resolve: null })

  const confirm = (message, confirmLabel = 'Confirmar') =>
    new Promise((resolve) => setState({ open: true, message, confirmLabel, resolve }))

  const handleConfirm = () => {
    state.resolve(true)
    setState((s) => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    state.resolve(false)
    setState((s) => ({ ...s, open: false }))
  }

  const dialog = (
    <ConfirmDialog
      open={state.open}
      message={state.message}
      confirmLabel={state.confirmLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, dialog }
}
