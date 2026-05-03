import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ErrorBoundary caught:', error.message, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-950 text-stone-400 p-8">
          <div className="w-16 h-16 mb-6 rounded-full border-2 border-stone-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-yishan text-stone-500 tracking-widest mb-2">页面加载异常</h2>
          <p className="text-sm text-stone-600 font-serif tracking-wide mb-6">请尝试刷新页面</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-xs font-mono tracking-widest uppercase border border-stone-700 text-stone-400 hover:text-stone-300 hover:border-stone-500 rounded transition-all cursor-pointer"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
