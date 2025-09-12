import React, { memo, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Componente de carga personalizado
const LoadingSpinner = ({ message = "Cargando..." }: { message?: string }) => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">{message}</span>
    </div>
)

// Componentes lazy con loading states específicos
export const LazyPredictionForm = dynamic(
    () => import('@/components/prediction-form').then(mod => ({ default: mod.PredictionForm })),
    {
        loading: () => <LoadingSpinner message="Cargando formulario de predicción..." />,
        ssr: false
    }
)

export const LazyPatientsList = dynamic(
    () => import('@/components/patients-list').then(mod => ({ default: mod.PatientsList })),
    {
        loading: () => <LoadingSpinner message="Cargando lista de pacientes..." />,
        ssr: false
    }
)

export const LazyReportsView = dynamic(
    () => import('@/components/reports').then(mod => ({ default: mod.ReportsView })),
    {
        loading: () => <LoadingSpinner message="Cargando reportes..." />,
        ssr: false
    }
)

export const LazyRealTimeAnalysis = dynamic(
    () => import('@/components/real-time-analysis').then(mod => ({ default: mod.RealTimeAnalysis })),
    {
        loading: () => <LoadingSpinner message="Cargando análisis en tiempo real..." />,
        ssr: false
    }
)

export const LazyMedicalDataImport = dynamic(
    () => import('@/components/medical-data-import').then(mod => ({ default: mod.MedicalDataImport })),
    {
        loading: () => <LoadingSpinner message="Cargando importador de datos..." />,
        ssr: false
    }
)

export const LazyCardioBot = dynamic(
    () => import('@/components/cardio-bot').then(mod => ({ default: mod.CardioBot })),
    {
        loading: () => <LoadingSpinner message="Cargando asistente CardioBot..." />,
        ssr: false
    }
)

// HOC para memoización inteligente
export function withMemoization<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    customComparison?: (prevProps: T, nextProps: T) => boolean
) {
    const MemoizedComponent = memo(Component, customComparison)
    MemoizedComponent.displayName = `withMemoization(${Component.displayName || Component.name})`
    return MemoizedComponent
}

// Hook optimizado para data fetching con cache
export function useOptimizedData<T>(
    fetchFn: () => Promise<T>,
    deps: React.DependencyList = [],
    cacheTime: number = 5 * 60 * 1000 // 5 minutos
) {
    const [data, setData] = React.useState<T | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<Error | null>(null)
    const cacheRef = React.useRef<{ data: T; timestamp: number } | null>(null)

    const fetchData = useCallback(async () => {
        // Verificar cache
        if (cacheRef.current) {
            const { data: cachedData, timestamp } = cacheRef.current
            if (Date.now() - timestamp < cacheTime) {
                setData(cachedData)
                return
            }
        }

        setLoading(true)
        setError(null)

        try {
            const result = await fetchFn()
            cacheRef.current = { data: result, timestamp: Date.now() }
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error desconocido'))
        } finally {
            setLoading(false)
        }
    }, deps)

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const refetch = useCallback(() => {
        cacheRef.current = null // Invalidar cache
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch }
}

// Componente para lazy loading de imágenes
export const LazyImage = memo(({
    src,
    alt,
    className = '',
    ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const [loaded, setLoaded] = React.useState(false)
    const [error, setError] = React.useState(false)
    const imgRef = React.useRef<HTMLImageElement>(null)

    React.useEffect(() => {
        const img = imgRef.current
        if (!img) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const image = new Image()
                        image.onload = () => setLoaded(true)
                        image.onerror = () => setError(true)
                        if (typeof src === 'string') {
                            image.src = src
                        }
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.1 }
        )

        observer.observe(img)
        return () => observer.disconnect()
    }, [src])

    if (error) {
        return (
            <div className={`bg-gray-200 flex items-center justify-center ${className}`} {...props}>
                <span className="text-sm text-gray-500">Error al cargar imagen</span>
            </div>
        )
    }

    return (
        <img
            ref={imgRef}
            src={loaded ? src : undefined}
            alt={alt}
            className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
            {...props}
        />
    )
})

LazyImage.displayName = 'LazyImage'

// Hook para scroll virtualization (grandes listas)
export function useVirtualization<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) {
    const [scrollTop, setScrollTop] = React.useState(0)

    const visibleRange = useMemo(() => {
        const start = Math.floor(scrollTop / itemHeight)
        const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
        return { start, end }
    }, [scrollTop, itemHeight, containerHeight, items.length])

    const visibleItems = useMemo(() =>
        items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
            item,
            index: visibleRange.start + index
        }))
        , [items, visibleRange])

    const totalHeight = items.length * itemHeight

    return {
        visibleItems,
        totalHeight,
        setScrollTop,
        visibleRange
    }
}
