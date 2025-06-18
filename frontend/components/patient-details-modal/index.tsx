"use client"
import { Heart, Activity, Scale, Calendar, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { patientService, Patient as PatientType } from "@/lib/services/patients"
import { User } from "lucide-react"

interface PatientDetailsModalProps {
  patient: PatientType | null
  isOpen: boolean
  onClose: () => void
}

export function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  const [fullPatient, setFullPatient] = useState<PatientType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && patient?.id) {
      setLoading(true)
      patientService.getPatient(patient.id)
        .then(data => setFullPatient(data))
        .catch(() => setFullPatient(patient))
        .finally(() => setLoading(false))
    } else {
      setFullPatient(null)
    }
  }, [isOpen, patient])

  if (!isOpen || !patient) return null
  if (loading || !fullPatient) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <span className="text-lg text-gray-500">Cargando detalles del paciente...</span>
      </div>
    )
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

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { category: "Bajo peso", color: "text-blue-600" }
    if (imc < 25) return { category: "Normal", color: "text-green-600" }
    if (imc < 30) return { category: "Sobrepeso", color: "text-yellow-600" }
    return { category: "Obesidad", color: "text-red-600" }
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

  const formatList = (text: string | undefined): string[] => {
    if (!text) return []
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  const prediccion = fullPatient.riesgo_actual;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                  {(fullPatient.nombre_completo || "").split(" ").map((n) => n[0]).join("") || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{fullPatient.nombre_completo || "Paciente Desconocido"}</DialogTitle>
                <DialogDescription className="text-lg">
                  {fullPatient.edad} años • Última consulta: {fullPatient.ultimo_registro ? formatDate(fullPatient.ultimo_registro) : "N/A"}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={`px-4 py-2 text-lg ${getRiskColor(prediccion?.riesgo_nivel)}`}>
              Riesgo {prediccion?.riesgo_nivel || "Desconocido"}
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
                <span>{fullPatient.telefono || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{fullPatient.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{fullPatient.direccion || "N/A"}</span>
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
                  <div className="text-2xl font-bold text-gray-800">
                    {prediccion?.probabilidad !== undefined && prediccion?.probabilidad !== null
                      ? `${Math.round(prediccion.probabilidad)}%`
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">Riesgo Cardiovascular</div>
                </div>
                {fullPatient.imc && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getIMCCategory(fullPatient.imc).color}`}>{fullPatient.imc}</div>
                    <div className="text-sm text-gray-600">IMC</div>
                  </div>
                )}
              </div>
              {/* Comentado: Presión arterial. Asumo que se manejará con MedicalRecords si es necesario. */}
              {/* {fullPatient.presion && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Presión Arterial:</span>
                  <span className="text-blue-700 font-bold">{fullPatient.presion} mmHg</span>
                </div>
              )} */}
              {fullPatient.colesterol && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium">Colesterol:</span>
                  <span className="text-yellow-700 font-bold">{fullPatient.colesterol} mg/dL</span>
                </div>
              )}
              {fullPatient.glucosa && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Glucosa:</span>
                  <span className="text-green-700 font-bold">{fullPatient.glucosa} mg/dL</span>
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
                {formatList(fullPatient.antecedentes_cardiacos).map((antecedente, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-orange-800">{antecedente}</span>
                  </div>
                ))}
                {formatList(fullPatient.antecedentes_cardiacos).length === 0 && (
                  <span className="text-sm text-gray-500">No hay antecedentes registrados.</span>
                )}
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
                {formatList(fullPatient.medicamentos_actuales).map((medicamento, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">{medicamento}</span>
                  </div>
                ))}
                {formatList(fullPatient.medicamentos_actuales).length === 0 && (
                  <span className="text-sm text-gray-500">No hay medicamentos registrados.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Recomendaciones */}
        {prediccion?.recomendaciones && prediccion.recomendaciones.length > 0 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul>
                  {prediccion.recomendaciones.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-700 mb-1">• {rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

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
