import { Component } from 'react'
import { Heart, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('FinWed — erro não tratado:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Heart size={20} className="text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">FinWed</span>
            </div>
            <p className="text-5xl font-bold text-red-300 mb-3">Ops!</p>
            <p className="text-gray-800 font-semibold mb-1">Algo deu errado.</p>
            <p className="text-sm text-gray-500 mb-7">
              Um erro inesperado ocorreu. Seus dados estão seguros no navegador.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              <RefreshCw size={16} />
              Recarregar o app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
