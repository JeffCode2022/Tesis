import React, { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

interface UseApiState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

interface UseApiOptions {
    immediate?: boolean
    onSuccess?: (data: any) => void
    onError?: (error: string) => void
    retryCount?: number
    retryDelay?: number
}

/**
 * Hook personalizado para manejar llamadas a la API de forma segura
 */
export function useApi<T = any>(
    config: AxiosRequestConfig,
    options: UseApiOptions = {}
) {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null
    })

    const abortControllerRef = useRef<AbortController | null>(null)
    const mountedRef = useRef(true)

    const {
        immediate = true,
        onSuccess,
        onError,
        retryCount = 0,
        retryDelay = 1000
    } = options

    // Cleanup en unmount
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const execute = React.useCallback(async (customConfig?: AxiosRequestConfig) => {
        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController()

        const finalConfig = {
            ...config,
            ...customConfig,
            signal: abortControllerRef.current.signal
        }

        if (!mountedRef.current) return

        setState(prev => ({ ...prev, loading: true, error: null }))

        let currentRetry = 0

        const makeRequest = async (): Promise<AxiosResponse<T>> => {
            try {
                return await api.request<T>(finalConfig)
            } catch (error: any) {
                // Si es un error de abort, no reintentar
                if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                    throw error
                }

                // Verificar si podemos reintentar
                if (currentRetry < retryCount && shouldRetry(error)) {
                    currentRetry++
                    console.log(`[useApi] Reintentando (${currentRetry}/${retryCount}) después de ${retryDelay}ms`)

                    await new Promise(resolve => setTimeout(resolve, retryDelay))

                    // Verificar si aún estamos mounted antes del reintento
                    if (!mountedRef.current) {
                        throw new Error('Component unmounted')
                    }

                    return makeRequest()
                }

                throw error
            }
        }

        try {
            const response = await makeRequest()

            if (!mountedRef.current) return

            setState({
                data: response.data,
                loading: false,
                error: null
            })

            onSuccess?.(response.data)

        } catch (error: any) {
            if (!mountedRef.current) return

            // No mostrar error si fue cancelado
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                return
            }

            const errorMessage = getErrorMessage(error)

            setState({
                data: null,
                loading: false,
                error: errorMessage
            })

            onError?.(errorMessage)
            console.error('[useApi] Error:', error)
        }
    }, [config, retryCount, retryDelay, onSuccess, onError])

    // Ejecutar inmediatamente si está habilitado
    useEffect(() => {
        if (immediate) {
            execute()
        }
    }, [immediate, execute])

    const refetch = React.useCallback(() => {
        return execute()
    }, [execute])

    const cancel = React.useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setState(prev => ({ ...prev, loading: false }))
        }
    }, [])

    return {
        ...state,
        execute,
        refetch,
        cancel
    }
}

/**
 * Determinar si un error es reinentable
 */
function shouldRetry(error: any): boolean {
    // Errores de red
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        return true
    }

    // Errores HTTP específicos
    if (error.response?.status) {
        const retryableStatuses = [408, 429, 500, 502, 503, 504]
        return retryableStatuses.includes(error.response.status)
    }

    return false
}

/**
 * Extraer mensaje de error legible
 */
function getErrorMessage(error: any): string {
    if (error.isNetworkError) {
        return error.message || 'Error de conexión'
    }

    if (error.isTimeout) {
        return 'La solicitud tardó demasiado tiempo'
    }

    if (error.response?.data?.message) {
        return error.response.data.message
    }

    if (error.response?.data?.error) {
        return error.response.data.error
    }

    if (error.message) {
        return error.message
    }

    return 'Ha ocurrido un error inesperado'
}

/**
 * Hook especializado para obtener listas paginadas
 */
export function usePaginatedApi<T = any>(
    baseUrl: string,
    options: UseApiOptions & {
        page?: number
        pageSize?: number
        search?: string
    } = {}
) {
    const { page = 1, pageSize = 50, search, ...restOptions } = options

    const config: AxiosRequestConfig = React.useMemo(() => {
        let url = `${baseUrl}?page=${page}&page_size=${pageSize}`
        if (search) {
            url += `&search=${encodeURIComponent(search)}`
        }

        return {
            method: 'GET',
            url
        }
    }, [baseUrl, page, pageSize, search])

    return useApi<{
        results: T[]
        count: number
        next: string | null
        previous: string | null
    }>(config, restOptions)
}

export default useApi
