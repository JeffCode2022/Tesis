"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { patientService, Patient } from "@/lib/services/patients"
import { predictionService, type PredictionResult } from "@/lib/services/predictions"
import { User } from "lucide-react"

interface PatientsListProps {
  importedPatients?: any[]
  onError?: (errorMessage: string) => void
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
        
        const patientsWithPredictions = await Promise.all(data.map(async (patient) => {
          const latestPrediction = await predictionService.getLatestPredictionForPatient(patient.id)
          return {
            ...patient,
            probabilidad: latestPrediction?.probabilidad || undefined,
            riesgo_actual: latestPrediction?.riesgo || patient.riesgo_actual // Actualiza el riesgo si la predicción tiene uno
          }
        }))

        setPatients(patientsWithPredictions)
        console.log('[PatientsList] Pacientes recibidos de la API con predicciones:', patientsWithPredictions)
      } catch (error) {
        setPatients([])
        onError?.(error instanceof Error ? error.message : 'Error al cargar los pacientes')
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
        return "border-red-500 text-red-700 bg-red-50"
      case "Medio":
        return "border-yellow-500 text-yellow-700 bg-yellow-50"
      case "Bajo":
        return "border-green-500 text-green-700 bg-green-50"
      default:
        return "border-gray-500 text-gray-700 bg-gray-50"
    }
  }

  const calculateIMC = (peso: number, altura: number): string => {
    if (typeof peso !== 'number' || typeof altura !== 'number' || peso <= 0 || altura <= 0) {
      return "N/A"
    }
    const alturaMetros = altura / 100 // Convertir cm a metros
    const imc = peso / (alturaMetros * alturaMetros)
    return imc.toFixed(2)
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) { // Check for "Invalid Date"
        return "N/A"
      }
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch (e) {
      console.error("Error formatting date:", e)
      return "N/A"
    }
  }

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <span className="text-lg text-gray-500">Cargando pacientes...</span>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle>Historial de Pacientes</CardTitle>
          <CardDescription className="text-indigo-100">
            Registro completo de evaluaciones realizadas ({allPatients.length} pacientes)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {allPatients.map((paciente, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer"
                onClick={() => handleViewDetails(paciente)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Info principal */}
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {paciente.nombre_completo
                            ? paciente.nombre_completo
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-800">{paciente.nombre_completo}</div>
                        <div className="text-sm text-gray-600">
                          {paciente.edad} años • IMC: {paciente.imc !== undefined && paciente.imc !== null ? paciente.imc : "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">{formatDate(paciente.ultimo_registro)}</div>
                      </div>
                    </div>
                    {/* Probabilidad y riesgo */}
                    <div className="flex items-center gap-6 min-w-[180px] justify-end">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                          {paciente.riesgo_actual?.probabilidad !== undefined && paciente.riesgo_actual?.probabilidad !== null
                            ? `${Math.round(paciente.riesgo_actual.probabilidad)}%`
                            : "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">Probabilidad</div>
                      </div>
                      <Badge variant="outline" className={`px-3 py-1 ${getRiskColor(paciente.riesgo_actual?.riesgo_nivel)}`}>
                        {paciente.riesgo_actual?.riesgo_nivel || "Desconocido"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(paciente)
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
        }}
      />
    </>
  )
}
