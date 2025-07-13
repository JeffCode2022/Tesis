"use client"

import React, { useState } from "react"
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
  FileText,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Patient } from "@/lib/services/patients"
import type { MedicalRecord } from "@/lib/services/patients"

interface PatientDetailsModalProps {
  patient: Patient | null
  medicalRecord: MedicalRecord | null
  isOpen: boolean
  onClose: () => void
  onSave?: (data: any) => Promise<void>
}

// Utilidad para parsear arrays o strings tipo '["texto1", "texto2"]'
function parseArrayField(field: any): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function PatientDetailsModal({ patient, medicalRecord, isOpen, onClose, onSave }: PatientDetailsModalProps) {
  const [editData, setEditData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (patient) {
      setEditData({
        telefono: patient.telefono || "",
        email: patient.email || "",
        direccion: patient.direccion || "",
        medicamentos_actuales: medicalRecord?.medicamentos_actuales ? Array.isArray(medicalRecord.medicamentos_actuales) ? medicalRecord.medicamentos_actuales.join(", ") : medicalRecord.medicamentos_actuales : "",
      })
      setSaved(false)
      setError(null)
    }
  }, [patient, medicalRecord])

  if (!isOpen || !patient) return null

  // Seleccionar el objeto de predicción correcto
  const prediccion = (patient.ultima_prediccion && Object.keys(patient.ultima_prediccion).length > 0)
    ? patient.ultima_prediccion
    : patient.riesgo_actual as any;

  const getRiskLevel = (risk: string | null) => {
    switch (risk?.toLowerCase()) {
      case "bajo":
        return {
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          percentageColor: "text-green-600",
          percentageBg: "bg-green-50"
        }
      case "medio":
        return {
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          percentageColor: "text-yellow-600",
          percentageBg: "bg-yellow-50"
        }
      case "alto":
        return {
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          percentageColor: "text-red-600",
          percentageBg: "bg-red-50"
        }
      default:
        return {
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          percentageColor: "text-blue-600",
          percentageBg: "bg-blue-50"
        }
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "N/A"
      }
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    } catch (e) {
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

  const calculateAge = (fechaNacimiento?: string): number => {
    if (!fechaNacimiento) return 0;
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value })
    setSaved(false)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (onSave) {
        await onSave(editData)
      }
      setSaved(true)
    } catch (err: any) {
      setError("Error al guardar. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  const generatePDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPosition = 30
    doc.setFont("helvetica")
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 25, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE PACIENTE CARDIOVASCULAR", margin, 15)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")}`, pageWidth - 60, 15)
    yPosition = 40
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DATOS DEL PACIENTE", margin, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const patientData = [
      `Nombre: ${patient.nombre_completo || "N/A"}`,
      `DNI: ${patient.dni || "N/A"}`,
      `Fecha de Nacimiento: ${patient.fecha_nacimiento ? formatDate(patient.fecha_nacimiento) : "N/A"}`,
      `Edad: ${calculateAge(patient.fecha_nacimiento)} años`,
      `Teléfono: ${editData.telefono || "N/A"}`,
      `Email: ${editData.email || "N/A"}`,
      `Dirección: ${editData.direccion || "N/A"}`,
    ]
    patientData.forEach((data, index) => {
      if (index % 2 === 0) {
        doc.text(data, margin, yPosition)
      } else {
        doc.text(data, pageWidth / 2 + 10, yPosition)
        yPosition += 6
      }
    })
    yPosition += 10
    if (prediccion) {
      const riskLevel = getRiskLevel(prediccion.riesgo_nivel);
      const riskColor = prediccion.riesgo_nivel?.toLowerCase() === "alto" ? [220, 38, 38] : 
                       prediccion.riesgo_nivel?.toLowerCase() === "medio" ? [245, 158, 11] : 
                       prediccion.riesgo_nivel?.toLowerCase() === "bajo" ? [34, 197, 94] : [59, 130, 246];
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, "F")
      doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2])
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, "S")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text("RESULTADO DE LA PREDICCIÓN", margin + 5, yPosition + 5)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      const riskPercentage = `${Number(prediccion.probabilidad).toFixed(1)}%`
      doc.text(riskPercentage, margin + 5, yPosition + 15)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Nivel de Riesgo: ${prediccion.riesgo_nivel}`, margin + 60, yPosition + 15)
      yPosition += 35
      if (prediccion.factores && prediccion.factores.length > 0) {
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("FACTORES DE RIESGO IDENTIFICADOS", margin, yPosition)
        yPosition += 8
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        prediccion.factores.forEach((factor: string, index: number) => {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 30
          }
          doc.text(`• ${factor}`, margin + 5, yPosition)
          yPosition += 5
        })
        yPosition += 5
      }
      if (prediccion.recomendaciones && prediccion.recomendaciones.length > 0) {
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("RECOMENDACIONES PERSONALIZADAS", margin, yPosition)
        yPosition += 8
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        prediccion.recomendaciones.forEach((rec: string, index: number) => {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 30
          }
          doc.text(`${index + 1}. ${rec}`, margin + 5, yPosition)
          yPosition += 5
        })
        yPosition += 10
      }
    }
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("ANTECEDENTES MÉDICOS", margin, yPosition)
    yPosition += 10
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const antecedentes = medicalRecord?.antecedentes_cardiacos
      ? Array.isArray(medicalRecord.antecedentes_cardiacos)
        ? medicalRecord.antecedentes_cardiacos
        : formatList(medicalRecord.antecedentes_cardiacos)
      : []
    if (antecedentes.length > 0) {
      antecedentes.forEach((antecedente: string, index: number) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }
        doc.text(`• ${antecedente}`, margin + 5, yPosition)
        yPosition += 5
      })
    } else {
      doc.text("No hay antecedentes registrados.", margin + 5, yPosition)
      yPosition += 5
    }
    yPosition += 10
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("MEDICAMENTOS ACTUALES", margin, yPosition)
    yPosition += 10
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const medicamentos = editData?.medicamentos_actuales
      ? formatList(editData.medicamentos_actuales)
      : (medicalRecord?.medicamentos_actuales
          ? (Array.isArray(medicalRecord.medicamentos_actuales)
              ? medicalRecord.medicamentos_actuales
              : formatList(medicalRecord.medicamentos_actuales))
          : [])
    if (medicamentos.length > 0) {
      medicamentos.forEach((medicamento: string, index: number) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }
        doc.text(`• ${medicamento}`, margin + 5, yPosition)
        yPosition += 5
      })
    } else {
      doc.text("No hay medicamentos registrados.", margin + 5, yPosition)
      yPosition += 5
    }
    yPosition = doc.internal.pageSize.height - 30
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      "Este reporte ha sido generado automáticamente por el Sistema de Predicción Cardiovascular",
      margin,
      yPosition,
    )
    doc.text(`Fecha de generación: ${new Date().toLocaleString("es-ES")}`, margin, yPosition + 5)
    yPosition += 15
    doc.setTextColor(0, 0, 0)
    doc.text("_________________________", pageWidth - 80, yPosition)
    doc.text("Firma del Médico", pageWidth - 75, yPosition + 5)
    const fileName = `reporte-paciente-${patient.dni || patient.id}-${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  }

  // --- UI ---
  const riskLevel = getRiskLevel(prediccion?.riesgo_nivel)

  const getNombreYApellidos = () => {
    if (patient?.nombre && patient?.apellidos) {
      return { nombre: patient.nombre, apellidos: patient.apellidos };
    }
    if (patient?.nombre_completo) {
      const partes = patient.nombre_completo.split(" ");
      return {
        nombre: partes[0] || "N/A",
        apellidos: partes.slice(1).join(" ") || "N/A"
      };
    }
    return { nombre: "N/A", apellidos: "N/A" };
  };
  const { nombre, apellidos } = getNombreYApellidos();
  const peso = patient?.peso || "N/A";
  const altura = patient?.altura || "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                {patient.nombre_completo || "Paciente"}
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                DNI: {patient.dni} • Edad: {calculateAge(patient.fecha_nacimiento)} años
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Bloque de riesgo si hay predicción */}
          {prediccion && (
            <div className={`${riskLevel.bg} ${riskLevel.border} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${riskLevel.bg} rounded-full flex items-center justify-center border-2 ${riskLevel.border}`}
                  >
                    <AlertCircle className={`w-5 h-5 ${riskLevel.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Riesgo Cardiovascular
                    </div>
                    <div className="text-3xl font-bold">
                      {prediccion.probabilidad ? `${Number(prediccion.probabilidad).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${riskLevel.color} ${riskLevel.bg} border ${riskLevel.border}`}
                >
                  {prediccion.riesgo_nivel}
                </div>
              </div>
            </div>
          )}

          {/* Grid de Información */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Factores de Riesgo */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Factores de Riesgo
                </h3>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {parseArrayField(prediccion?.factores_riesgo || prediccion?.factores).slice(0, 6).map((factor: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{factor}</span>
                  </div>
                ))}
                {(parseArrayField(prediccion?.factores_riesgo || prediccion?.factores).length === 0) && (
                  <p className="text-xs text-gray-500 italic">No se identificaron factores de riesgo significativos.</p>
                )}
              </div>
            </div>
            {/* Recomendaciones */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Recomendaciones
                </h3>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {parseArrayField(prediccion?.recomendaciones).slice(0, 6).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">{index + 1}</span>
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{rec}</span>
                  </div>
                ))}
                {(parseArrayField(prediccion?.recomendaciones).length === 0) && (
                  <p className="text-xs text-gray-500 italic">No hay recomendaciones personalizadas.</p>
                )}
              </div>
            </div>
          </div>

          {/* Datos del Paciente y Clínicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Datos Personales */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                  Datos Personales
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Nombre:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{nombre}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Apellidos:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{apellidos}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">DNI:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{patient?.dni || "N/A"}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Fecha de Nacimiento:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{patient?.fecha_nacimiento || "N/A"}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Edad:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{calculateAge(patient?.fecha_nacimiento)} años</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Sexo:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{patient?.sexo || "N/A"}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Peso:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{peso !== "N/A" ? `${peso} kg` : "N/A"}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Altura:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{altura !== "N/A" ? `${altura} cm` : "N/A"}</div>
                </div>
              </div>
            </div>
            {/* Datos Clínicos */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                  Datos Clínicos
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Presión:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">
                    {medicalRecord?.presion_sistolica}/{medicalRecord?.presion_diastolica}
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">FC:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">
                    {medicalRecord?.frecuencia_cardiaca} bpm
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Colesterol:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">{medicalRecord?.colesterol} mg/dL</div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Glucosa:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">{medicalRecord?.glucosa} mg/dL</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto y Medicamentos (editables) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contacto */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Información de Contacto
                </h3>
              </div>
              <div className="space-y-2">
                <Input
                  name="telefono"
                  value={editData?.telefono || ""}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="text-xs"
                />
                <Input
                  name="email"
                  value={editData?.email || ""}
                  onChange={handleChange}
                  placeholder="Email"
                  className="text-xs"
                />
                <Input
                  name="direccion"
                  value={editData?.direccion || ""}
                  onChange={handleChange}
                  placeholder="Dirección"
                  className="text-xs"
                />
              </div>
            </div>
            {/* Medicamentos */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-green-600" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Medicamentos Actuales
                </h3>
              </div>
              <Textarea
                name="medicamentos_actuales"
                value={editData?.medicamentos_actuales || ""}
                onChange={handleChange}
                placeholder="Lista de medicamentos separados por coma"
                className="text-xs"
                rows={3}
              />
            </div>
          </div>

          {/* Antecedentes Médicos */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-semibold text-orange-900 dark:text-orange-100 uppercase tracking-wide">
                Antecedentes Médicos
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicalRecord?.antecedentes_cardiacos && Array.isArray(medicalRecord.antecedentes_cardiacos) && medicalRecord.antecedentes_cardiacos.length > 0 ? (
                medicalRecord.antecedentes_cardiacos.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-orange-200 dark:border-orange-700">
                    <span className="text-orange-700 dark:text-orange-300 font-medium">{item}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No hay antecedentes registrados.</span>
              )}
            </div>
          </div>

          {/* Condiciones Médicas */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2">
              Condiciones Médicas
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Diabetes", value: medicalRecord?.diabetes ? "Sí" : "No" },
                { label: "Hipertensión", value: medicalRecord?.hipertension ? "Sí" : "No" },
                { label: "Ant. Cardíacos", value: medicalRecord?.antecedentes_cardiacos && Array.isArray(medicalRecord.antecedentes_cardiacos) && medicalRecord.antecedentes_cardiacos.length > 0 ? "Sí" : "No" },
                { label: "Tabaquismo", value: medicalRecord?.anos_tabaquismo ? `${medicalRecord.anos_tabaquismo} años` : "No" },
                { label: "Actividad", value: medicalRecord?.actividad_fisica || "N/A" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-amber-200 dark:border-amber-700"
                >
                  <span className="text-amber-700 dark:text-amber-300 font-medium">{item.label}:</span>
                  <span className="text-amber-900 dark:text-amber-100 font-semibold ml-1">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Generado el {new Date().toLocaleDateString("es-ES")} • HC: {patient.numero_historia}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generatePDF}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-700"
            >
              <FileText className="w-3 h-3 mr-1" />
              Exportar PDF
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8 px-4 text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
              disabled={saving}
            >
              {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
            </Button>
            <Button onClick={onClose} size="sm" className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </div>
        </div>
        {error && <div className="text-xs text-red-600 text-center pb-2">{error}</div>}
      </DialogContent>
    </Dialog>
  )
}