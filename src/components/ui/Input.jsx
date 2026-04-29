import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ label, error, className = '', type, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
            ${error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'}
            disabled:bg-gray-50 disabled:text-gray-400 ${isPassword ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
            tabIndex={-1}
            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="form-error mt-1">{error}</p>}
    </div>
  )
}
