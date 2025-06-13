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

  // Se elimina este useEffect, ya que la redirección se maneja dentro del hook useAuth.
  // useEffect(() => {
  //   if (!isLoading) {
  //     if (!isAuthenticated && !isAuthPage) {
  //       router.push("/login")
  //     } else if (isAuthenticated && isAuthPage) {
  //       router.push("/dashboard")
  //     }
  //   }
  // }, [isLoading, isAuthenticated, isAuthPage, router])

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
