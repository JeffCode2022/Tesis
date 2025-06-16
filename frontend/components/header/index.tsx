"use client"

import { Heart, Stethoscope, Bell, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

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
  const { logout } = useAuth()
  const router = useRouter()
  const displayName = userName || "Usuario"
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Precisión del modelo: <span className="font-semibold text-green-600 dark:text-green-400">{modelAccuracy}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{userRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
