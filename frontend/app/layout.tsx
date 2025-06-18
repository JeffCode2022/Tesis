"use client"

import { Inter } from "next/font/google"
import "./globals.css"
// import { ThemeProvider } from "@/components/theme-provider" // Desactivado temporalmente
import { useAuth } from "@/hooks/useAuth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthPage) {
        router.push("/login")
      } else if (isAuthenticated && isAuthPage) {
        router.push("/dashboard")
      }
    }
  }, [isLoading, isAuthenticated, isAuthPage, router])

  if (isLoading) {
    return (
      <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider> */}
        {children} {/* Renderizar children directamente */}
      </body>
    </html>
  )
}
