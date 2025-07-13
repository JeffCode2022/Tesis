"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, X, AlertCircle, CheckCircle, User, Activity, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type React from "react"

interface PredictionResultModalProps {
  open: boolean
  onClose: () => void
  predictionResult: any
  formData: any
}

export const PredictionResultModal: React.FC<PredictionResultModalProps> = ({
  open,
  onClose,
  predictionResult,
  formData,
}) => {
  if (!predictionResult) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <p className="text-center text-gray-500">No hay datos de predicción disponibles.</p>
          <Button onClick={onClose} className="mt-4">Cerrar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const getRiskLevel = (risk: string) => {
    console.log('[PredictionResultModal] Nivel de riesgo recibido:', risk);
    switch (risk?.toLowerCase()) {
      case "bajo":
        return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle }
      case "medio":
        return { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: AlertCircle }
      case "alto":
        return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle }
      default:
        return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Heart }
    }
  }

  const generatePDF = async () => {
    // Importar jsPDF dinámicamente
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPosition = 30

    // Configurar fuentes
    doc.setFont("helvetica")

    // Header del documento
    doc.setFillColor(59, 130, 246) // Blue-600
    doc.rect(0, 0, pageWidth, 25, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE PREDICCIÓN CARDIOVASCULAR", margin, 15)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")}`, pageWidth - 60, 15)

    yPosition = 40

    // Información del paciente
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DATOS DEL PACIENTE", margin, yPosition)

    yPosition += 10
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const patientData = [
      `Nombre: ${formData.nombre} ${formData.apellidos}`,
      `DNI: ${formData.dni}`,
      `Fecha de Nacimiento: ${formData.fecha_nacimiento}`,
      `Sexo: ${formData.sexo}`,
      `N° Historia Clínica: ${formData.numero_historia}`,
      `Edad: ${formData.fecha_nacimiento ? new Date().getFullYear() - new Date(formData.fecha_nacimiento).getFullYear() : "N/A"} años`,
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

    // Resultado principal
    doc.setFillColor(239, 246, 255) // Blue-50
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, "F")
    doc.setDrawColor(219, 234, 254) // Blue-200
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, "S")

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235) // Blue-600
    doc.text("RESULTADO DE LA PREDICCIÓN", margin + 5, yPosition + 5)

    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    const riskPercentage = `${Number(predictionResult.probabilidad).toFixed(1)}%`
    doc.text(riskPercentage, margin + 5, yPosition + 15)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Nivel de Riesgo: ${predictionResult.riesgo_nivel}`, margin + 60, yPosition + 15)

    yPosition += 35

    // Factores de riesgo
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("FACTORES DE RIESGO IDENTIFICADOS", margin, yPosition)

    yPosition += 8
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    predictionResult.factores?.forEach((factor: string, index: number) => {
      if (yPosition > 250) {
        // Nueva página si es necesario
        doc.addPage()
        yPosition = 30
      }
      doc.text(`• ${factor}`, margin + 5, yPosition)
      yPosition += 5
    })

    yPosition += 5

    // Recomendaciones
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("RECOMENDACIONES PERSONALIZADAS", margin, yPosition)

    yPosition += 8
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    predictionResult.recomendaciones?.forEach((rec: string, index: number) => {
      if (yPosition > 250) {
        // Nueva página si es necesario
        doc.addPage()
        yPosition = 30
      }
      doc.text(`${index + 1}. ${rec}`, margin + 5, yPosition)
      yPosition += 5
    })

    yPosition += 10

    // Datos clínicos
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DATOS CLÍNICOS", margin, yPosition)

    yPosition += 10
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    const clinicalData = [
      [`Peso: ${formData.peso} kg`, `Altura: ${formData.altura} cm`],
      [
        `Presión Arterial: ${formData.presion_sistolica}/${formData.presion_diastolica} mmHg`,
        `Frecuencia Cardíaca: ${formData.frecuencia_cardiaca} bpm`,
      ],
      [`Colesterol: ${formData.colesterol} mg/dL`, `Glucosa: ${formData.glucosa} mg/dL`],
      [`Cigarrillos/día: ${formData.cigarrillos_dia}`, `Años de Tabaquismo: ${formData.anos_tabaquismo}`],
      [`Actividad Física: ${formData.actividad_fisica}`, `Diabetes: ${formData.diabetes}`],
      [`Hipertensión: ${formData.hipertension}`, `Antecedentes Cardíacos: ${formData.antecedentes_cardiacos}`],
    ]

    clinicalData.forEach(([left, right]) => {
      doc.text(left, margin, yPosition)
      doc.text(right, pageWidth / 2 + 10, yPosition)
      yPosition += 6
    })

    // Footer
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

    // Espacio para firma médica
    yPosition += 15
    doc.setTextColor(0, 0, 0)
    doc.text("_________________________", pageWidth - 80, yPosition)
    doc.text("Firma del Médico", pageWidth - 75, yPosition + 5)

    // Guardar el PDF
    const fileName = `reporte-cardiovascular-${formData.dni}-${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  }

  const riskLevel = getRiskLevel(predictionResult?.riesgo_nivel)
  const RiskIcon = riskLevel.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg overflow-hidden">
        {/* Header Compacto */}
        <DialogHeader className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                Reporte Cardiovascular
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.nombre} {formData.apellidos} • {formData.dni}
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
          {/* Resultado Principal */}
          <div className={`${riskLevel.bg} ${riskLevel.border} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${riskLevel.bg} rounded-full flex items-center justify-center border-2 ${riskLevel.border}`}
                >
                  <RiskIcon className={`w-5 h-5 ${riskLevel.color}`} />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Riesgo Cardiovascular
                  </div>
                  <div className="text-3xl font-bold">
                      {predictionResult.probabilidad ? `${Number(predictionResult.probabilidad).toFixed(1)}%` : '0%'}
                    </div>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${riskLevel.color} ${riskLevel.bg} border ${riskLevel.border}`}
              >
                {predictionResult.riesgo_nivel}
              </div>
            </div>
          </div>

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
                {(predictionResult.factores_riesgo || predictionResult.factores || []).slice(0, 6).map((factor: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{factor}</span>
                  </div>
                ))}
                {(predictionResult.factores_riesgo?.length === 0 && predictionResult.factores?.length === 0) && (
                  <p className="text-xs text-gray-500 italic">No se identificaron factores de riesgo significativos.</p>
                )}
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Recomendaciones
                </h3>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {predictionResult.recomendaciones?.slice(0, 6).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">{index + 1}</span>
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Datos del Paciente */}
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
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Edad:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">
                    {formData.fecha_nacimiento
                      ? new Date().getFullYear() - new Date(formData.fecha_nacimiento).getFullYear()
                      : "N/A"}{" "}
                    años
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Sexo:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{formData.sexo}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Peso:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{formData.peso} kg</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Altura:</span>
                  <div className="text-blue-900 dark:text-blue-100 font-semibold">{formData.altura} cm</div>
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
                    {formData.presion_sistolica}/{formData.presion_diastolica}
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">FC:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">
                    {formData.frecuencia_cardiaca} bpm
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Colesterol:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">{formData.colesterol} mg/dL</div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Glucosa:</span>
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">{formData.glucosa} mg/dL</div>
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones Médicas */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2">
              Condiciones Médicas
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Diabetes", value: formData.diabetes },
                { label: "Hipertensión", value: formData.hipertension },
                { label: "Ant. Cardíacos", value: formData.antecedentes_cardiacos },
                { label: "Tabaquismo", value: formData.anos_tabaquismo ? `${formData.anos_tabaquismo} años` : "No" },
                { label: "Actividad", value: formData.actividad_fisica },
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
            Generado el {new Date().toLocaleDateString("es-ES")} • HC: {formData.numero_historia}
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
            <Button onClick={onClose} size="sm" className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
