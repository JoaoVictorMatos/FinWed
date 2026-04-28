import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const TIMEOUT = 60 * 60 * 1000       // 1 hora
const WARNING_AT = 55 * 60 * 1000    // aviso aos 55 min (5 min antes)

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

export function useInactivityTimer() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const logoutRef = useRef(null)
  const warningRef = useRef(null)

  const reset = useCallback(() => {
    setShowWarning(false)
    clearTimeout(logoutRef.current)
    clearTimeout(warningRef.current)

    warningRef.current = setTimeout(() => setShowWarning(true), WARNING_AT)

    logoutRef.current = setTimeout(() => {
      logout()
      navigate('/login', { state: { expired: true } })
    }, TIMEOUT)
  }, [logout, navigate])

  useEffect(() => {
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
      clearTimeout(logoutRef.current)
      clearTimeout(warningRef.current)
    }
  }, [reset])

  return { showWarning, keepAlive: reset }
}
