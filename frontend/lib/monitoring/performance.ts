/**
 * Sistema de monitoreo y métricas para frontend
 */
import React from 'react'

// Métricas de Web Vitals
interface WebVitalsMetric {
    name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB'
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    delta: number
    id: string
}

// Métricas personalizadas
interface CustomMetric {
    name: string
    value: number
    timestamp: number
    tags?: Record<string, string>
}

class PerformanceMonitor {
    private metrics: CustomMetric[] = []
    private observers: PerformanceObserver[] = []

    constructor() {
        this.initializeObservers()
    }

    private initializeObservers() {
        // Observer para Resource Timing
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        this.trackResourceTiming(entry as PerformanceResourceTiming)
                    }
                })
            })

            resourceObserver.observe({ entryTypes: ['resource'] })
            this.observers.push(resourceObserver)

            // Observer para Navigation Timing
            const navigationObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        this.trackNavigationTiming(entry as PerformanceNavigationTiming)
                    }
                })
            })

            navigationObserver.observe({ entryTypes: ['navigation'] })
            this.observers.push(navigationObserver)
        }
    }

    private trackResourceTiming(entry: PerformanceResourceTiming) {
        const duration = entry.responseEnd - entry.requestStart

        this.addMetric({
            name: 'resource_load_time',
            value: duration,
            timestamp: Date.now(),
            tags: {
                resource_type: this.getResourceType(entry.name),
                resource_size: entry.transferSize?.toString() || 'unknown'
            }
        })
    }

    private trackNavigationTiming(entry: PerformanceNavigationTiming) {
        this.addMetric({
            name: 'page_load_time',
            value: entry.loadEventEnd - entry.fetchStart,
            timestamp: Date.now()
        })

        this.addMetric({
            name: 'dom_content_loaded',
            value: entry.domContentLoadedEventEnd - entry.fetchStart,
            timestamp: Date.now()
        })
    }

    private getResourceType(url: string): string {
        if (url.includes('.js')) return 'script'
        if (url.includes('.css')) return 'stylesheet'
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image'
        if (url.includes('/api/')) return 'api'
        return 'other'
    }

    // Métricas Web Vitals
    trackWebVitals() {
        if (typeof window !== 'undefined') {
            // Simplified web vitals tracking without external dependency
            this.trackCLS()
            this.trackLCP()
            this.trackFCP()
        }
    }

    private trackCLS() {
        // Simplified CLS tracking
        let cls = 0
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                    cls += (entry as any).value
                }
            }
            this.addMetric({
                name: 'web_vital_cls',
                value: cls,
                timestamp: Date.now(),
                tags: { rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor' }
            })
        }).observe({ type: 'layout-shift', buffered: true })
    }

    private trackLCP() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            const lastEntry = entries[entries.length - 1]
            this.addMetric({
                name: 'web_vital_lcp',
                value: lastEntry.startTime,
                timestamp: Date.now(),
                tags: { rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor' }
            })
        }).observe({ type: 'largest-contentful-paint', buffered: true })
    }

    private trackFCP() {
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.addMetric({
                        name: 'web_vital_fcp',
                        value: entry.startTime,
                        timestamp: Date.now(),
                        tags: { rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor' }
                    })
                }
            }
        }).observe({ type: 'paint', buffered: true })
    }

    // Agregar métrica personalizada
    addMetric(metric: CustomMetric) {
        this.metrics.push(metric)

        // Enviar métricas periódicamente
        if (this.metrics.length >= 10) {
            this.sendMetrics()
        }
    }

    // Métricas de usuario
    trackUserInteraction(action: string, details?: Record<string, any>) {
        this.addMetric({
            name: 'user_interaction',
            value: 1,
            timestamp: Date.now(),
            tags: {
                action,
                ...details
            }
        })
    }

    // Métricas de errores
    trackError(error: Error, context?: string) {
        this.addMetric({
            name: 'javascript_error',
            value: 1,
            timestamp: Date.now(),
            tags: {
                error_name: error.name,
                error_message: error.message,
                context: context || 'unknown'
            }
        })
    }

    // Métricas de API
    trackApiCall(endpoint: string, method: string, duration: number, status: number) {
        this.addMetric({
            name: 'api_call',
            value: duration,
            timestamp: Date.now(),
            tags: {
                endpoint,
                method,
                status: status.toString(),
                status_class: this.getStatusClass(status)
            }
        })
    }

    private getStatusClass(status: number): string {
        if (status >= 200 && status < 300) return 'success'
        if (status >= 300 && status < 400) return 'redirect'
        if (status >= 400 && status < 500) return 'client_error'
        if (status >= 500) return 'server_error'
        return 'unknown'
    }

    // Enviar métricas al servidor
    private async sendMetrics() {
        if (this.metrics.length === 0) return

        const metricsToSend = [...this.metrics]
        this.metrics = []

        try {
            // En un caso real, enviarías a tu API de métricas
            console.log('[PerformanceMonitor] Enviando métricas:', metricsToSend)

            // Example API call:
            // await fetch('/api/metrics', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ metrics: metricsToSend })
            // })
        } catch (error) {
            console.error('[PerformanceMonitor] Error enviando métricas:', error)
            // Re-agregar métricas para reintento
            this.metrics.unshift(...metricsToSend)
        }
    }

    // Obtener resumen de métricas
    getMetricsSummary() {
        const summary = {
            total_metrics: this.metrics.length,
            by_name: {} as Record<string, number>,
            recent_errors: this.metrics
                .filter(m => m.name === 'javascript_error')
                .slice(-5)
        }

        this.metrics.forEach(metric => {
            summary.by_name[metric.name] = (summary.by_name[metric.name] || 0) + 1
        })

        return summary
    }

    // Limpiar observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
    }
}

// Instancia singleton
export const performanceMonitor = new PerformanceMonitor()

// Hook para usar el monitor
export const usePerformanceMonitor = () => {
    React.useEffect(() => {
        performanceMonitor.trackWebVitals()

        return () => {
            // Cleanup no es necesario ya que es singleton
        }
    }, [])

    const trackUserAction = React.useCallback((action: string, details?: Record<string, any>) => {
        performanceMonitor.trackUserInteraction(action, details)
    }, [])

    const trackError = React.useCallback((error: Error, context?: string) => {
        performanceMonitor.trackError(error, context)
    }, [])

    return {
        trackUserAction,
        trackError,
        getMetricsSummary: performanceMonitor.getMetricsSummary.bind(performanceMonitor)
    }
}

// HOC para trackear componentes
export function withPerformanceTracking<P extends Record<string, any>>(
    WrappedComponent: React.ComponentType<P>,
    componentName?: string
) {
    const ComponentWithTracking = (props: P) => {
        const startTime = React.useRef<number>(0)

        React.useEffect(() => {
            startTime.current = performance.now()

            return () => {
                if (startTime.current) {
                    const renderTime = performance.now() - startTime.current
                    performanceMonitor.addMetric({
                        name: 'component_render_time',
                        value: renderTime,
                        timestamp: Date.now(),
                        tags: {
                            component: componentName || WrappedComponent.displayName || WrappedComponent.name
                        }
                    })
                }
            }
        }, [])

        return React.createElement(WrappedComponent, props)
    }

    ComponentWithTracking.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`

    return ComponentWithTracking
}

export default performanceMonitor
