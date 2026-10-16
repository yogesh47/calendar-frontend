import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ErrorInfo, ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  message?: string
}

type ErrorBoundaryState = {
  failed: boolean
  detail: string
}

const DEFAULT_MESSAGE = 'Something went wrong on this screen.'

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, detail: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { failed: true, detail: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[calendar] render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="flex max-w-[28rem] flex-col items-center gap-3 rounded-xl border p-8 text-center [background-color:var(--ds-color-bg-surface)]">
          <TriangleAlert className="size-6 [color:var(--ds-color-danger)]" />
          <p className="text-sm font-semibold">{this.props.message ?? DEFAULT_MESSAGE}</p>
          {this.state.detail && (
            <p className="text-xs [color:var(--ds-color-text-secondary)]">{this.state.detail}</p>
          )}
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" />
            Reload
          </Button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
