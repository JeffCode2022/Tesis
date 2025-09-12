'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
    children: React.ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorId: string
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorId: Math.random().toString(36).substring(7)
        }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorId: Math.random().toString(36).substring(7)
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log del error para monitoreo
        console.error('Error capturado por ErrorBoundary:', {
            error: error.message,
            stack: error.stack,
            errorInfo,
            errorId: this.state.errorId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        })

        // Aquí puedes integrar con servicios como Sentry, LogRocket, etc.
        // Ejemplo: Sentry.captureException(error, { contexts: { errorInfo } })
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorId: Math.random().toString(36).substring(7)
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Algo salió mal
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Ha ocurrido un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div className="text-sm text-gray-500">
                                Error ID: <code className="font-mono">{this.state.errorId}</code>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left">
                                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                        Detalles del error (desarrollo)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                        {this.state.error.message}
                                        {this.state.error.stack && (
                                            <>
                                                {'\n\n'}
                                                {this.state.error.stack}
                                            </>
                                        )}
                                    </pre>
                                </details>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button
                                    onClick={this.handleReset}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Intentar de nuevo
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/dashboard'}
                                >
                                    Ir al inicio
                                </Button>
                            </div>

                            <p className="text-xs text-gray-500">
                                Si el problema persiste, por favor contacta con soporte técnico.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook para capturar errores async fuera de componentes
export function useErrorHandler() {
    const handleError = (error: Error, context?: string) => {
        const errorId = Math.random().toString(36).substring(7)

        console.error('Error manejado:', {
            error: error.message,
            stack: error.stack,
            context,
            errorId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        })

        // Aquí puedes integrar con servicios de monitoreo
        // Ejemplo: Sentry.captureException(error, { tags: { context } })

        return errorId
    }

    return { handleError }
}
