export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white transition-colors
          ${error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'}
          disabled:bg-gray-50 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
