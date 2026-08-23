import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-8 my-6 text-center animate-fade-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(200,0,10,0.1)', border: '1px solid rgba(200,0,10,0.25)' }}
          >
            <AlertTriangle size={26} style={{ color: 'var(--peru-red)' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Ocurrió un error inesperado</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'No se pudo cargar este módulo.'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
          >
            <RefreshCw size={13} />
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
