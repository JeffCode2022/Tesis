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
  Database
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"

const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })

export default function PatientsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('patients')

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderContent = () => {
    switch (activeSection) {
      case 'patients':
        return (
          <>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Lista de Pacientes</h1>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            <PatientsList onError={(errorMessage) => setError(errorMessage)} />
          </>
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
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
} 