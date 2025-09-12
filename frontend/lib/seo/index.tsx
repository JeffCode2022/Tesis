
import Head from 'next/head'
import React from 'react'

interface SEOProps {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonicalUrl?: string
    noindex?: boolean
    structured?: StructuredData
}

interface StructuredData {
    '@context': string
    '@type': string
    [key: string]: any
}

export const SEOHead: React.FC<SEOProps> = ({
    title = 'Sistema de Predicción Cardiovascular',
    description = 'Sistema avanzado de predicción y análisis de riesgo cardiovascular usando inteligencia artificial',
    keywords = ['predicción cardiovascular', 'inteligencia artificial', 'salud', 'medicina'],
    ogImage = '/images/og-image.png',
    canonicalUrl,
    noindex = false,
    structured
}) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const fullTitle = title.includes('Sistema de Predicción') ? title : `${title} | Sistema de Predicción Cardiovascular`
    const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : undefined

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content="Sistema de Predicción Cardiovascular" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />

            {/* Robots */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Canonical URL */}
            {fullCanonicalUrl && <link rel="canonical" href={fullCanonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={`${siteUrl}${ogImage}`} />
            <meta property="og:url" content={fullCanonicalUrl || siteUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Sistema de Predicción Cardiovascular" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

            {/* Structured Data */}
            {structured && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structured)
                    }}
                />
            )}

            {/* Performance & Security */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="//fonts.googleapis.com" />

            {/* Favicon */}
            <link rel="icon" href="/favicon.ico" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="manifest" href="/manifest.json" />
        </Head>
    )
}

// Hook para generar structured data dinámicamente
export const useStructuredData = (type: string, data: Record<string, any>): StructuredData => {
    return React.useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': type,
        ...data
    }), [type, data])
}

// Componente para breadcrumbs con structured data
interface BreadcrumbItem {
    name: string
    url?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
    const structuredData = useStructuredData('BreadcrumbList', {
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url ? `${process.env.NEXT_PUBLIC_SITE_URL}${item.url}` : undefined
        }))
    })

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <nav aria-label="Breadcrumb" className={className}>
                <ol className="flex items-center space-x-2 text-sm">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center">
                            {index > 0 && (
                                <span className="mx-2 text-gray-400" aria-hidden="true">
                                    /
                                </span>
                            )}
                            {item.url ? (
                                <a
                                    href={item.url}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    aria-current={index === items.length - 1 ? 'page' : undefined}
                                >
                                    {item.name}
                                </a>
                            ) : (
                                <span
                                    className={index === items.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}
                                    aria-current={index === items.length - 1 ? 'page' : undefined}
                                >
                                    {item.name}
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        </>
    )
}

// Componente para skip links (accesibilidad)
export const SkipLinks: React.FC = () => {
    return (
        <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
            <a
                href="#main-content"
                className="bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Saltar al contenido principal
            </a>
            <a
                href="#navigation"
                className="bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
            >
                Saltar a navegación
            </a>
        </div>
    )
}

// Hook para anunciar cambios dinámicos a screen readers
export const useScreenReaderAnnouncer = () => {
    const [announcement, setAnnouncement] = React.useState('')

    const announce = React.useCallback((message: string) => {
        setAnnouncement('')
        // Small delay to ensure screen reader picks up the change
        setTimeout(() => setAnnouncement(message), 100)
    }, [])

    const AnnouncerComponent = React.useMemo(() => (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announcement}
        </div>
    ), [announcement])

    return { announce, AnnouncerComponent }
}

// Utilidades de accesibilidad
export const a11yUtils = {
    // Generar ID único para asociar labels con inputs
    generateId: (prefix: string = 'element') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

    // Verificar si el usuario prefiere reducir movimiento
    prefersReducedMotion: () => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },

    // Verificar si el usuario prefiere alto contraste
    prefersHighContrast: () => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(prefers-contrast: high)').matches
    },

    // Trap focus dentro de un elemento
    trapFocus: (element: HTMLElement) => {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>

        const firstFocusable = focusableElements[0]
        const lastFocusable = focusableElements[focusableElements.length - 1]

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus()
                        e.preventDefault()
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus()
                        e.preventDefault()
                    }
                }
            }

            if (e.key === 'Escape') {
                // Close modal or return focus to trigger
                const event = new CustomEvent('escapeFocus')
                element.dispatchEvent(event)
            }
        }

        element.addEventListener('keydown', handleTabKey)
        firstFocusable?.focus()

        return () => {
            element.removeEventListener('keydown', handleTabKey)
        }
    }
}
