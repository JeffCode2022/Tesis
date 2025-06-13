"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { Patient } from "@/lib/services/patients"

interface PatientsListProps {
  patients: Patient[]
  importedPatients: any[]
}

export function PatientsList({ patients, importedPatients }: PatientsListProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const allPatients = [...patients, ...importedPatients.slice(0, 5)]

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  const getRiskColor = (riesgo: string) => {
    switch (riesgo) {
      case "Alto":
        return "border-red-500 text-red-700 bg-red-50"
      case "Medio":
        return "border-yellow-500 text-yellow-700 bg-yellow-50"
      default:
        return "border-green-500 text-green-700 bg-green-50"
    }
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {paciente.nombre
                            ? paciente.nombre
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "UN"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-800">{paciente.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {paciente.edad} años • IMC: {paciente.imc || "N/A"} • {paciente.fecha || "Hoy"}
                        </div>
                        {paciente.presion && <div className="text-xs text-gray-500">Presión: {paciente.presion}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                          {paciente.probabilidad || Math.floor(Math.random() * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Probabilidad</div>
                      </div>
                      <Badge variant="outline" className={`px-3 py-1 ${getRiskColor(paciente.riesgo || "Desconocido")}`}>
                        {paciente.riesgo || "Desconocido"}
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
