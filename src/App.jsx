import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Profile from './pages/Profile'
import Categories from './pages/Categories'
import PlannedExpenses from './pages/PlannedExpenses'
import ErrorPage from './pages/ErrorPage'

import { useEffect } from 'react'

function PrivateRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const autoLoginDev = useAuthStore((s) => s.autoLoginDev)

  useEffect(() => {
    if (!user) {
      autoLoginDev()
    }
  }, [user, autoLoginDev])

  if (!user) return null // Wait for auto login
  return <Layout>{children}</Layout>
}

function PublicRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const autoLoginDev = useAuthStore((s) => s.autoLoginDev)

  useEffect(() => {
    if (!user) {
      autoLoginDev()
    }
  }, [user, autoLoginDev])

  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transacoes" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/orcamentos" element={<PrivateRoute><Budgets /></PrivateRoute>} />
        <Route path="/metas" element={<PrivateRoute><Goals /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute><Categories /></PrivateRoute>} />
        <Route path="/gastos" element={<PrivateRoute><PlannedExpenses /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
