"use client"

import React from "react"
import {
  Heart,
  Activity,
  Scale,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  User,
  Pencil,
  Download,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Patient } from "@/lib/services/patients"

interface PatientDetailsModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

export function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  if (!isOpen || !patient) return null

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
      if (isNaN(date.getTime())) {
        return "N/A"
      }
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    } catch (e) {
      console.error("Error formatting date:", e)
      return "N/A"
    }
  }

  const formatList = (text: string | undefined): string[] => {
    if (!text) return []
    return text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  const handleEdit = () => {
    // Placeholder for edit functionality
    alert("Editar paciente: funcionalidad en desarrollo")
  }

  const handleExport = () => {
    // Placeholder for export functionality
    alert("Exportar datos: funcionalidad en desarrollo")
  }

  const prediccion = patient.riesgo_actual as any

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-0 shadow-lg">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-md">
          <DialogHeader className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarFallback className="bg-white/20 dark:bg-gray-900/40 text-white text-xl font-semibold">
                    {(patient.nombre_completo || "")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("") || <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-2xl font-semibold">
                    {patient.nombre_completo || "Paciente Desconocido"}
                  </DialogTitle>
                  <DialogDescription className="text-white/90 text-sm flex items-center gap-4">
                    <span className="flex items-center gap-2 bg-white/20 dark:bg-gray-900/40 px-2 py-1 rounded-md">
                      <User className="w-4 h-4" />
                      {patient.edad} años
                    </span>
                    <span className="flex items-center gap-2 bg-white/20 dark:bg-gray-900/40 px-2 py-1 rounded-md">
                      <Calendar className="w-4 h-4" />
                      {patient.ultimo_registro ? formatDate(patient.ultimo_registro) : "N/A"}
                    </span>
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`px-4 py-2 text-sm font-semibold border-2 ${getRiskColor(prediccion?.riesgo_nivel)}`}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Riesgo {prediccion?.riesgo_nivel || "Desconocido"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5 text-[#3B82F6]" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{patient.telefono || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{patient.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{patient.direccion || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-[#3B82F6]" />
                    Métricas de Salud
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                      <div className="text-3xl font-semibold text-red-600 dark:text-red-400">
                        {prediccion?.probabilidad !== undefined ? `${Math.round(prediccion.probabilidad)}%` : "N/A"}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {prediccion?.riesgo_nivel ? `Riesgo ${prediccion.riesgo_nivel}` : "Riesgo Cardiovascular"}
                      </div>
                    </div>
                    {patient.imc && (
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <div className={`text-3xl font-semibold ${getIMCCategory(patient.imc).color} dark:text-white`}>
                          {patient.imc}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">IMC</div>
                        <div className={`text-xs ${getIMCCategory(patient.imc).color} dark:text-white`}>
                          {getIMCCategory(patient.imc).category}
                        </div>
                      </div>
                    )}
                  </div>
                  {prediccion?.recomendaciones && prediccion.recomendaciones.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
                        Recomendaciones:
                      </div>
                      <ul className="space-y-2">
                        {prediccion.recomendaciones.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-2 h-2 bg-[#3B82F6] rounded-full mt-1.5"></div>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-red-600" />
                    Antecedentes Médicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {formatList(patient.antecedentes_cardiacos).map((antecedente, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-orange-800 dark:text-orange-300">{antecedente}</span>
                      </div>
                    ))}
                    {formatList(patient.antecedentes_cardiacos).length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">No hay antecedentes registrados.</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    Medicamentos Actuales
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {formatList(patient.medicamentos_actuales).map((medicamento, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-800 dark:text-blue-300">{medicamento}</span>
                      </div>
                    ))}
                    {formatList(patient.medicamentos_actuales).length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Scale className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">No hay medicamentos registrados.</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2"
              >
                Cerrar
              </Button>
              <Button
                onClick={handleEdit}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2"
              >
                <Pencil className="mr-1 h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleExport}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2"
              >
                <Download className="mr-1 h-4 w-4" />
                Exportar
              </Button>
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2">
                <Calendar className="mr-1 h-4 w-4" />
                Agendar Cita
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2">
                <Heart className="mr-1 h-4 w-4" />
                Nueva Evaluación
              </Button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #3B82F6;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #2563EB;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}