"use client"
import { Heart, Activity, Scale, Calendar, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Patient {
  nombre: string
  edad: number
  riesgo: string
  fecha: string
  probabilidad: number
  imc?: number
  presion?: string
  colesterol?: number
  glucosa?: number
  telefono?: string
  email?: string
  direccion?: string
  antecedentes?: string[]
  medicamentos?: string[]
  ultimaConsulta?: string
}

interface PatientDetailsModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

export function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  if (!patient) return null

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

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { category: "Bajo peso", color: "text-blue-600" }
    if (imc < 25) return { category: "Normal", color: "text-green-600" }
    if (imc < 30) return { category: "Sobrepeso", color: "text-yellow-600" }
    return { category: "Obesidad", color: "text-red-600" }
  }

  // Datos simulados adicionales
  const patientData = {
    ...patient,
    telefono: patient.telefono || "+51 999 123 456",
    email: patient.email || `${(patient.nombre || "").toLowerCase().replace(/\s/g, ".")}@email.com`,
    direccion: patient.direccion || "Av. Principal 123, Lima, Perú",
    antecedentes: patient.antecedentes || ["Hipertensión familiar", "Diabetes tipo 2 (padre)"],
    medicamentos: patient.medicamentos || ["Enalapril 10mg", "Metformina 500mg"],
    ultimaConsulta: patient.ultimaConsulta || "2024-01-10",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`/placeholder.svg?height=64&width=64`} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                  {(patient.nombre || "").split(" ").map((n) => n[0]).join("") || "UN"}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{patient.nombre || "Paciente Desconocido"}</DialogTitle>
                <DialogDescription className="text-lg">
                  {patient.edad} años • Última consulta: {patientData.ultimaConsulta}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={`px-4 py-2 text-lg ${getRiskColor(patient.riesgo)}`}>
              Riesgo {patient.riesgo}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patientData.telefono}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{patientData.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{patientData.direccion}</span>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Salud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Métricas de Salud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{patient.probabilidad}%</div>
                  <div className="text-sm text-gray-600">Riesgo Cardiovascular</div>
                </div>
                {patient.imc && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getIMCCategory(patient.imc).color}`}>{patient.imc}</div>
                    <div className="text-sm text-gray-600">IMC</div>
                  </div>
                )}
              </div>
              {patient.presion && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Presión Arterial:</span>
                  <span className="text-blue-700 font-bold">{patient.presion} mmHg</span>
                </div>
              )}
              {patient.colesterol && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium">Colesterol:</span>
                  <span className="text-yellow-700 font-bold">{patient.colesterol} mg/dL</span>
                </div>
              )}
              {patient.glucosa && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Glucosa:</span>
                  <span className="text-green-700 font-bold">{patient.glucosa} mg/dL</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Antecedentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Antecedentes Médicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patientData.antecedentes.map((antecedente, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-orange-800">{antecedente}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medicamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Medicamentos Actuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patientData.medicamentos.map((medicamento, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">{medicamento}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Cita
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Heart className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
