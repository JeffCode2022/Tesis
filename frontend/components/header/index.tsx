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
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
              <Heart className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                CardioPredict AI
              </h1>
              <p className="text-blue-200 text-sm">Policlínico Laura Caller - Sistema Predictivo Avanzado</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-blue-200">Precisión del Modelo</div>
              <div className="text-2xl font-bold text-green-400">{modelAccuracy}%</div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white">
                    {notifications}
                  </Badge>
                )}
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarImage src="/placeholder.svg" alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <div className="text-sm font-medium">{displayName}</div>
                  <div className="text-xs text-blue-200">{userRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
