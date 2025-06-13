"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { PatientsList } from "@/components/patients-list" // Asegúrate de que esta ruta sea correcta
import { patientService, type Patient } from "@/lib/services/patients"
import dynamic from "next/dynamic"

const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })

export default function PatientsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await patientService.getPatients()
        if (Array.isArray(patientsData)) {
          setPatients(patientsData)
        } else {
          console.error('API returned non-array data for patients:', patientsData)
          setPatients([])
        }
      } catch (error) {
        console.error("Error loading patients:", error)
      } finally {
        setLoadingPatients(false)
      }
    }

    if (isAuthenticated) {
      loadPatients()
    }
  }, [isAuthenticated])

  if (isLoading || loadingPatients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando pacientes...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // O redirigir a una página de error/acceso denegado
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Header modelAccuracy={0} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Lista de Pacientes</h1>
        <PatientsList patients={patients} importedPatients={[]} />
      </main>
    </div>
  )
} 