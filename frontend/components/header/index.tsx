"use client"

import { Heart, Stethoscope, Bell, Settings, User, LogOut, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

interface HeaderProps {
  modelAccuracy: number
  notifications?: number
  userName?: string
  userRole?: string
}

export function Header({ 
  modelAccuracy, 
  notifications = 0,
  userName = "Usuario",
  userRole = "Médico"
}: HeaderProps) {
  const { logout, user } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const displayName = (user?.nombre || userName || "Usuario").toUpperCase()
  const initials = (user?.nombre || userName || "Usuario")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
  const email = user?.email || ""

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-white/20 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/30 dark:border-gray-700 shadow-xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {modelAccuracy >= 90 ? (
            <span className="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 font-bold text-lg shadow-sm">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Precisión del modelo:
              <span className="text-2xl font-extrabold text-green-700 dark:text-green-300">{modelAccuracy}%</span>
            </span>
          ) : modelAccuracy >= 75 ? (
            <span className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-4 py-2 font-bold text-lg shadow-sm">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              Precisión del modelo:
              <span className="text-2xl font-extrabold text-yellow-700 dark:text-yellow-300">{modelAccuracy}%</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 font-bold text-lg shadow-sm">
              <XCircle className="w-6 h-6 text-red-500" />
              Precisión del modelo:
              <span className="text-2xl font-extrabold text-red-700 dark:text-red-300">{modelAccuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-800 dark:text-white uppercase">{displayName}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-300 lowercase">{email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-full"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <button
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
