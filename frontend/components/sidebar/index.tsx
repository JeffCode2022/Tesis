import { Heart, LayoutDashboard, Users, FileText, BarChart3, Settings, Database, Activity } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'predictions', label: 'Predicciones', icon: Activity },
    { id: 'import', label: 'Importar Datos', icon: Database },
    { id: 'reports', label: 'Reportes', icon: FileText, href: '#' },
    { id: 'analytics', label: 'Analíticas', icon: BarChart3, href: '#' },
    { id: 'settings', label: 'Configuración', icon: Settings, href: '#' },
  ]

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-6 w-6 text-red-500" />
          <span className="text-xl font-semibold">CardioPredict</span>
        </div>
        <nav className="space-y-1">
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
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 shadow-md backdrop-blur-sm'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
} 