"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { PatientsList } from "@/components/patients-list"
import dynamic from "next/dynamic"
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Heart,
  Activity,
  Database,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })

export default function PatientsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('patients')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderContent = () => {
    switch (activeSection) {
      case 'patients':
        return (
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Activity className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Patients List Component - Completamente minimalista */}
            <PatientsList
              searchQuery={searchQuery}
              onError={(errorMessage: string) => setError(errorMessage)}
            />
          </div>
        )
      case 'dashboard':
      case 'predictions':
      case 'import':
        router.push('/dashboard')
        return null
      default:
        return <div className="p-4">Contenido en desarrollo...</div>
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header modelAccuracy={0} />
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Gestión de Pacientes
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Sistema integral de monitoreo cardiovascular
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/patients/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </Button>
              </div>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
} 