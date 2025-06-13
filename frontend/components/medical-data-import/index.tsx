"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Database, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface MedicalDataImportProps {
  importedPatients: any[]
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDataProcess: (data: string) => void
}

export function MedicalDataImport({ importedPatients, onFileUpload, onDataProcess }: MedicalDataImportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [medicalData, setMedicalData] = useState("")

  const handleProcessData = () => {
    onDataProcess(medicalData)
    setMedicalData("")
    setShowImportDialog(false)
  }

  const exportData = () => {
    const csvContent = [
      "Nombre,Edad,Presión,Colesterol,Riesgo",
      ...importedPatients.map((p) => `${p.nombre},${p.edad},${p.presion},${p.colesterol || "N/A"},${p.riesgo}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pacientes_exportados.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Importación de datos */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Datos Médicos
          </CardTitle>
          <CardDescription className="text-indigo-100">Integre registros médicos existentes al sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-gray-700 font-medium">
                Cargar archivo de datos
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json,.txt"
                onChange={onFileUpload}
                className="border-gray-300 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Formatos soportados: CSV, JSON, TXT</p>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">O</div>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Pegar datos manualmente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Importar Datos Médicos</DialogTitle>
                    <DialogDescription>
                      Pegue los datos médicos en formato CSV o texto separado por comas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Ejemplo:&#10;Juan Pérez,45,140/90,220,Masculino&#10;María García,38,120/80,180,Femenino&#10;..."
                      value={medicalData}
                      onChange={(e) => setMedicalData(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleProcessData} className="flex-1" disabled={!medicalData.trim()}>
                        <Database className="mr-2 h-4 w-4" />
                        Procesar Datos
                      </Button>
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Formatos de Integración:</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="font-medium text-blue-800">Sistema HIS/EMR</div>
                <div className="text-sm text-blue-600">Integración directa con sistemas hospitalarios</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <div className="font-medium text-green-800">API REST</div>
                <div className="text-sm text-green-600">Conexión en tiempo real con bases de datos</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="font-medium text-purple-800">HL7 FHIR</div>
                <div className="text-sm text-purple-600">Estándar internacional de interoperabilidad</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos importados */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datos Procesados
          </CardTitle>
          <CardDescription className="text-emerald-100">Registros médicos integrados al sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {importedPatients.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">{importedPatients.length} registros importados</div>
                <Button size="sm" variant="outline" onClick={exportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {importedPatients.slice(0, 10).map((patient, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{patient.nombre}</div>
                        <div className="text-sm text-gray-600">
                          Edad: {patient.edad} | Presión: {patient.presion}
                        </div>
                      </div>
                      <Badge
                        variant={
                          patient.riesgo === "Alto"
                            ? "destructive"
                            : patient.riesgo === "Medio"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {patient.riesgo}
                      </Badge>
                    </div>
                  </div>
                ))}
                {importedPatients.length > 10 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    Y {importedPatients.length - 10} registros más...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600">No hay datos importados</div>
              <div className="text-sm text-gray-500">Importe archivos de datos médicos para comenzar el análisis</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
