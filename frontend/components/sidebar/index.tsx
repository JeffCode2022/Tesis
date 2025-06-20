"use client"

import {
  Heart,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Database,
  Activity,
  Search,
  ChevronLeft,
  User,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  userName?: string
  patientsCount?: number
  reportsCount?: number
}

export function Sidebar({ activeSection, setActiveSection, userName, patientsCount = 0, reportsCount = 0 }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const displayName = (
    (user?.first_name && user?.last_name)
      ? `${user.first_name} ${user.last_name}`
      : userName || "Usuario"
  ).toUpperCase()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "patients", label: "Pacientes", icon: Users, badge: patientsCount },
    { id: "predictions", label: "Predicciones", icon: Activity },
    { id: "import", label: "Importar Datos", icon: Database },
    { id: "reports", label: "Reportes", icon: FileText, href: "#", badge: reportsCount },
    { id: "analytics", label: "Analíticas", icon: BarChart3, href: "#" },
    { id: "settings", label: "Configuración", icon: Settings, href: "#" },
  ]

  return (
    <div className="bg-transparent p-4 flex flex-col justify-center h-full">
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl border border-white/30 dark:border-gray-700 shadow-xl rounded-2xl transition-all duration-300 ease-in-out flex flex-col relative`}
      >
        {/* macOS-style window controls */}
        <div className="flex items-center gap-2 p-4 pb-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>

        {/* Header with logo */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            {!isCollapsed && <span className="text-xl font-semibold text-gray-800 dark:text-white">CardioPredict</span>}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          {!isCollapsed ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Search"
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg h-10 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-0 focus:border-0"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="w-10 h-10 rounded-lg hover:bg-gray-100">
                <Search className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation - TU LÓGICA EXACTA PRESERVADA */}
        <nav className="px-4 space-y-1 pb-0 mb-0">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.href && item.href !== pathname) {
                    router.push(item.href)
                  } else {
                    setActiveSection(item.id)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                  activeSection === item.id
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <Icon className={`w-5 h-5 ${activeSection === item.id ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />

                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          activeSection === item.id
                            ? "bg-blue-500 text-white"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="flex-1 px-4 space-y-1"></div>
        <div className="mt-4 pt-2 pb-4 px-4 border-t border-gray-100 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""} py-2 px-2`}>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold">
                {(user?.nombre || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white truncate uppercase">{displayName}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-300 truncate lowercase">{user?.email || ""}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle button */}
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 p-0"
        >
          <ChevronLeft
            className={`w-3 h-3 text-gray-600 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          />
        </Button>
      </aside>
    </div>
  )
}
