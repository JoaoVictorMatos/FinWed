export default function Footer({ theme = 'light' }) {
  const isDark = theme === 'dark'
  
  const textColor1 = isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'
  const textColor2 = isDark ? 'text-gray-300' : 'text-gray-400'
  
  return (
    <footer className="mt-8 pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
      <a href="https://newai.net.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
        <span className={`text-[11px] font-medium transition-colors uppercase tracking-wide ${textColor1}`}>
          Desenvolvido por
        </span>
        <img 
          src="/imgs/newai-logo.png" 
          alt="NewAI" 
          className="h-4 sm:h-5 w-auto drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
        />
        <span className={`hidden text-sm font-bold ${isDark ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
          NewAI
        </span>
      </a>
      <p className={`text-[10px] ${textColor2}`}>
        &copy; {new Date().getFullYear()} NewAI. Todos os direitos reservados.
      </p>
    </footer>
  )
}
