"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { patientService, type Patient } from "@/lib/services/patients"
import { predictionService } from "@/lib/services/predictions"
import { User, Heart, Activity, Calendar, Eye, Users } from "lucide-react"

interface PatientsListProps {
  importedPatients?: any[]
  onError?: (errorMessage: string) => void
}

// Estado de carga
function LoadingState() {
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#2563EB]/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/30 dark:bg-gray-900/30 rounded-full blur-2xl"></div>
      </div>
      <div className="relative z-10 min-h-[400px] flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700 p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg mb-6 mx-auto animate-pulse">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <span className="text-xl font-semibold text-gray-800">Cargando pacientes...</span>
          <p className="text-gray-600 mt-2">Obteniendo datos del sistema CardioPredict</p>
        </div>
      </div>
    </div>
  )
}

// Estado vacío
function EmptyState() {
  return (
    <div className="text-center py-12 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-gray-700">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pacientes registrados</h3>
      <p className="text-gray-500">Los pacientes aparecerán aquí una vez que sean registrados en el sistema.</p>
    </div>
  )
}

// Encabezado de la lista
function PatientsListHeader({ count }: { count: number }) {
  return (
    <CardHeader className="bg-[#2563EB]/90 dark:bg-[#2563EB]/80 backdrop-blur-xl rounded-t-3xl text-white shadow-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-[#2563EB]/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold drop-shadow">Historial de Pacientes</CardTitle>
      </div>
      <CardDescription className="text-white/90 text-base drop-shadow">
        Registro completo de evaluaciones realizadas ({count} pacientes)
      </CardDescription>
    </CardHeader>
  )
}

// Tarjeta de paciente
function PatientCard({ paciente, onViewDetails, getRiskColor, formatDate }: any) {
  // Función para color del badge según riesgo
  const getBadgeColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/30"
      case "Medio":
        return "border-orange-500 text-orange-500 bg-orange-500/10 hover:bg-orange-500/30"
      case "Bajo":
        return "border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500/30"
      default:
        return "border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/30"
    }
  }
  // Función para color del bloque de probabilidad
  const getProbBlockColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "bg-red-500/90 border-red-500 text-white"
      case "Medio":
        return "bg-orange-500/90 border-orange-500 text-white"
      case "Bajo":
        return "bg-green-500/90 border-green-500 text-white"
      default:
        return "bg-blue-500/90 border-blue-500 text-white"
    }
  }
  const riesgoNivel = paciente.riesgo_actual?.riesgo_nivel
  return (
    <Card
      className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden relative px-4 py-3"
      onClick={() => onViewDetails(paciente)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-900/20 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between gap-6 flex-row w-full">
        {/* Info principal */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 shadow-lg border-2 border-[#2563EB]/30">
              <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] font-bold text-lg">
                {paciente.nombre_completo ? paciente.nombre_completo.split(" ").map((n: string) => n[0]).join("") : <User className="h-7 w-7 text-[#2563EB]" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="font-semibold tracking-wide text-base text-gray-900 dark:text-white truncate group-hover:text-[#2563EB] transition-colors">
              {paciente.nombre_completo}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{paciente.edad} años</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>IMC: {paciente.imc !== undefined && paciente.imc !== null ? paciente.imc : "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(paciente.ultimo_registro)}</span>
            </div>
          </div>
        </div>
        {/* Probabilidad, riesgo y botón */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className={`text-center rounded-xl px-5 py-2 text-2xl font-bold shadow-md flex flex-col items-center min-w-[90px] ${getProbBlockColor(riesgoNivel)}`}>
            <div className="text-white">
              {paciente.riesgo_actual?.probabilidad !== undefined && paciente.riesgo_actual?.probabilidad !== null ? `${Math.round(paciente.riesgo_actual.probabilidad)}%` : "N/A"}
            </div>
            <div className="text-xs text-white/80 font-medium">Probabilidad</div>
          </div>
          <Badge
            variant="outline"
            className={`px-4 py-2 font-semibold border-2 transition-all duration-300 rounded-xl ${getBadgeColor(riesgoNivel)}`}
          >
            {paciente.riesgo_actual?.riesgo_nivel || "Desconocido"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/30 rounded-xl px-4 py-2 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(paciente)
            }}
          >
            <Eye className="w-4 h-4 mr-2 text-blue-500 group-hover:text-white transition-colors" />
            Ver Detalles
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function PatientsList({ importedPatients = [], onError }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getPatients()
        const patientsWithPredictions = await Promise.all(
          data.map(async (patient) => {
            const latestPrediction = await predictionService.getLatestPredictionForPatient(patient.id)
            return {
              ...patient,
              probabilidad: latestPrediction?.probabilidad || undefined,
              riesgo_actual: latestPrediction?.riesgo || patient.riesgo_actual,
            }
          })
        )
        setPatients(patientsWithPredictions)
        console.log("[PatientsList] Pacientes recibidos de la API con predicciones:", patientsWithPredictions)
      } catch (error) {
        setPatients([])
        onError?.(error instanceof Error ? error.message : "Error al cargar los pacientes")
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [onError])

  const allPatients = [...patients, ...(importedPatients || []).slice(0, 5)]

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  const getRiskColor = (riesgo: string | null) => {
    switch (riesgo) {
      case "Alto":
        return "border-red-500 text-red-700 bg-red-50/80 backdrop-blur-sm"
      case "Medio":
        return "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/10 backdrop-blur-sm"
      case "Bajo":
        return "border-[#2563EB]/60 text-[#2563EB]/80 bg-[#2563EB]/5 backdrop-blur-sm"
      default:
        return "border-gray-500 text-gray-700 bg-gray-50/80 backdrop-blur-sm"
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    } catch {
      return "N/A"
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#2563EB]/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/20 dark:bg-gray-900/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gray-200/30 rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-4xl px-4">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-2xl border border-white/30 dark:border-gray-700 rounded-3xl overflow-hidden max-h-[70vh] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            <PatientsListHeader count={allPatients.length} />
            <CardContent className="relative z-10 p-8 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {allPatients.length === 0 ? (
                  <EmptyState />
                ) : (
                  allPatients.map((paciente, index) => (
                    <PatientCard
                      key={index}
                      paciente={paciente}
                      onViewDetails={handleViewDetails}
                      getRiskColor={getRiskColor}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
        }}
      />
    </div>
  )
}
