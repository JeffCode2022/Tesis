import React from 'react'

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo
        })

        // Log error to monitoring service
        console.error('[ErrorBoundary] Error capturado:', error, errorInfo)

        // Call custom error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }

        // En producción, enviar error a servicio de monitoreo
        if (process.env.NODE_ENV === 'production') {
            this.reportError(error, errorInfo)
        }
    }

    reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
        try {
            // Aquí enviarías el error a tu servicio de monitoreo
            // Ejemplo: Sentry, LogRocket, etc.
            const errorReport = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: localStorage.getItem('user_id') // Si tienes ID de usuario
            }

            // En un caso real, enviarías esto a tu API
            console.log('[ErrorBoundary] Error reportado:', errorReport)

            // Example API call:
            // await fetch('/api/errors/report', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(errorReport)
            // })
        } catch (reportingError) {
            console.error('[ErrorBoundary] Error al reportar error:', reportingError)
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback
                return <FallbackComponent error={this.state.error!} reset={this.handleReset} />
            }

            return (
                <DefaultErrorFallback
                    error={this.state.error!}
                    reset={this.handleReset}
                    errorInfo={this.state.errorInfo}
                />
            )
        }

        return this.props.children
    }
}

// Componente de fallback por defecto
const DefaultErrorFallback: React.FC<{
    error: Error
    reset: () => void
    errorInfo?: React.ErrorInfo | null
}> = ({ error, reset, errorInfo }) => {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-red-600">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        ¡Oops! Algo salió mal
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Ha ocurrido un error inesperado en la aplicación
                    </p>
                </div>

                {isDevelopment && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-sm text-red-700">
                            <p className="font-semibold">Error:</p>
                            <p className="mt-1 font-mono text-xs">{error.message}</p>
                            {error.stack && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                                    <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
                                </details>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Intentar de nuevo
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Recargar página
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Volver al inicio
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Si el problema persiste, contacta al soporte técnico
                    </p>
                </div>
            </div>
        </div>
    )
}

// Hook para usar error boundary funcionalmente
export const useErrorHandler = () => {
    const [error, setError] = React.useState<Error | null>(null)

    const resetError = React.useCallback(() => {
        setError(null)
    }, [])

    const handleError = React.useCallback((error: Error) => {
        console.error('[useErrorHandler] Error capturado:', error)
        setError(error)
    }, [])

    React.useEffect(() => {
        if (error) {
            throw error
        }
    }, [error])

    return { handleError, resetError }
}

export default ErrorBoundary
