import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'
import { reportError } from '../../lib/sentry'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

const isHebrew = () => document.documentElement.lang === 'he'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info)
    reportError(error)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary">
        <div className="error-boundary__card">
          <span className="error-boundary__icon">⚠️</span>
          <h1 className="error-boundary__title">
            {isHebrew() ? 'משהו השתבש' : 'Something went wrong'}
          </h1>
          <p className="error-boundary__subtitle">
            {isHebrew()
              ? 'קרתה שגיאה בלתי צפויה. נסה לרענן את הדף.'
              : 'An unexpected error occurred. Try reloading the page.'}
          </p>
          <button className="error-boundary__btn" onClick={this.handleReload}>
            {isHebrew() ? 'רענן' : 'Reload'}
          </button>
        </div>
      </div>
    )
  }
}
