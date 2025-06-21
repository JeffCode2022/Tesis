"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileText, Database, Download, Brain, AlertCircle, CheckCircle, Loader2, Users, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { predictionService } from "@/lib/services/predictions"
import { patientService, type Patient } from "@/lib/services/patients"

interface MedicalDataImportProps {
  importedPatients: any[]
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDataProcess: (data: string) => void
}

interface ProcessedPatient {
  nombre: string
  apellidos: string
  dni: string
  edad: number
  sexo: string
  peso: number
  altura: number
  presionSistolica: number
  presionDiastolica: number
  colesterol: number
  glucosa: number
  cigarrillosDia: number
  anosTabaquismo: number
  actividadFisica: string
  antecedentesCardiacos: string
  numero_historia: string
}

interface PredictionResult {
  id: string
  riesgo: string
  probabilidad: number
  factores: string[]
  recomendaciones: string[]
  updated_at: string
  patient_id: string
  medical_record_id: string | null
}

export function MedicalDataImport({ importedPatients, onFileUpload, onDataProcess }: MedicalDataImportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [medicalData, setMedicalData] = useState("")
  const [processedPatients, setProcessedPatients] = useState<ProcessedPatient[]>([])
  
  // Estados optimizados para la carga de pacientes existentes
  const [displayExistingPatients, setDisplayExistingPatients] = useState<Patient[]>([])
  const [existingPatientsCount, setExistingPatientsCount] = useState(0)
  const [predictedPatientsData, setPredictedPatientsData] = useState<ProcessedPatient[]>([])

  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [predictionProgress, setPredictionProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Cargar una muestra de pacientes existentes y el conteo total al montar el componente
  useEffect(() => {
    loadExistingPatients()
  }, [])

  const loadExistingPatients = async () => {
    setIsLoadingExisting(true)
    setError("")
    try {
      // Cargar solo los primeros 10 para visualización y obtener el conteo total
      const { patients, total } = await patientService.getPatients(1, 10)
      setDisplayExistingPatients(patients)
      setExistingPatientsCount(total)
      console.log(`[MedicalDataImport] Cargados ${patients.length} de ${total} pacientes existentes para visualización.`)
    } catch (err: any) {
      setError("Error al cargar pacientes existentes: " + err.message)
      console.error("[MedicalDataImport] Error cargando pacientes:", err)
    } finally {
      setIsLoadingExisting(false)
    }
  }

  const handleProcessData = () => {
    onDataProcess(medicalData)
    setMedicalData("")
    setShowImportDialog(false)
  }

  // Función para procesar archivos CSV/JSON
  const processFileData = async (file: File) => {
    setIsProcessing(true)
    setError("")
    setSuccess("")
    setProcessingProgress(0)
    
    try {
      const text = await file.text()
      let patients: ProcessedPatient[] = []
      
      if (file.name.endsWith('.csv')) {
        patients = parseCSVData(text)
      } else if (file.name.endsWith('.json')) {
        patients = parseJSONData(text)
      } else {
        throw new Error("Formato de archivo no soportado")
      }
      
      setProcessedPatients(patients)
      setSuccess(`Se procesaron ${patients.length} pacientes correctamente`)
      setProcessingProgress(100)
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo")
    } finally {
      setIsProcessing(false)
    }
  }

  // Función para parsear datos CSV
  const parseCSVData = (csvText: string): ProcessedPatient[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const patients: ProcessedPatient[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < headers.length) continue
      
      const patient: any = {}
      headers.forEach((header, index) => {
        patient[header] = values[index]
      })
      
      // Mapear campos del CSV a la estructura requerida
      const processedPatient: ProcessedPatient = {
        nombre: patient.nombre || patient.name || "",
        apellidos: patient.apellidos || patient.apellido || patient.lastname || "",
        dni: patient.dni || patient.identificacion || "",
        edad: parseInt(patient.edad || patient.age || "0"),
        sexo: patient.sexo || patient.gender || "M",
        peso: parseFloat(patient.peso || patient.weight || "0"),
        altura: parseInt(patient.altura || patient.height || "0"),
        presionSistolica: parseInt(patient.presionsistolica || patient.presion_sistolica || patient.systolic || "0"),
        presionDiastolica: parseInt(patient.presiondiastolica || patient.presion_diastolica || patient.diastolic || "0"),
        colesterol: parseFloat(patient.colesterol || patient.cholesterol || "0"),
        glucosa: parseFloat(patient.glucosa || patient.glucose || "0"),
        cigarrillosDia: parseInt(patient.cigarrillos || patient.cigarettes || "0"),
        anosTabaquismo: parseInt(patient.anosfumando || patient.smoking_years || "0"),
        actividadFisica: patient.actividadfisica || patient.physical_activity || "sedentario",
        antecedentesCardiacos: patient.antecedentes || patient.family_history || "no",
        numero_historia: patient.historia || patient.medical_record || `HC${Date.now()}${i}`
      }
      
      // Validar datos mínimos requeridos
      if (processedPatient.nombre && processedPatient.edad > 0) {
        patients.push(processedPatient)
      }
    }
    
    return patients
  }

  // Función para parsear datos JSON
  const parseJSONData = (jsonText: string): ProcessedPatient[] => {
    const data = JSON.parse(jsonText)
    const patients: ProcessedPatient[] = []
    
    const array = Array.isArray(data) ? data : [data]
    
    array.forEach((patient: any, index: number) => {
      const processedPatient: ProcessedPatient = {
        nombre: patient.nombre || patient.name || "",
        apellidos: patient.apellidos || patient.apellido || patient.lastname || "",
        dni: patient.dni || patient.identificacion || "",
        edad: parseInt(patient.edad || patient.age || "0"),
        sexo: patient.sexo || patient.gender || "M",
        peso: parseFloat(patient.peso || patient.weight || "0"),
        altura: parseInt(patient.altura || patient.height || "0"),
        presionSistolica: parseInt(patient.presionSistolica || patient.presion_sistolica || patient.systolic || "0"),
        presionDiastolica: parseInt(patient.presionDiastolica || patient.presion_diastolica || patient.diastolic || "0"),
        colesterol: parseFloat(patient.colesterol || patient.cholesterol || "0"),
        glucosa: parseFloat(patient.glucosa || patient.glucose || "0"),
        cigarrillosDia: parseInt(patient.cigarrillosDia || patient.cigarettes || "0"),
        anosTabaquismo: parseInt(patient.anosTabaquismo || patient.smoking_years || "0"),
        actividadFisica: patient.actividadFisica || patient.physical_activity || "sedentario",
        antecedentesCardiacos: patient.antecedentesCardiacos || patient.family_history || "no",
        numero_historia: patient.numero_historia || patient.medical_record || `HC${Date.now()}${index}`
      }
      
      if (processedPatient.nombre && processedPatient.edad > 0) {
        patients.push(processedPatient)
      }
    })
    
    return patients
  }

  // Función para predicción masiva
  const handleMassPrediction = async () => {
    setIsPredicting(true)
    setError("")
    setSuccess("")
    setPredictionProgress(0)
    
    try {
      // 1. Obtener pacientes existentes optimizados para predicción desde el nuevo endpoint
      console.log("[MedicalDataImport] Obteniendo pacientes optimizados para predicción desde el backend...")
      const existingPatientsForPrediction = await patientService.getAllPatientsForPrediction()
      
      // 2. Combinar con los pacientes recién importados/procesados
      const allPatientsToPredict = [...processedPatients, ...existingPatientsForPrediction]

      // Guardar los datos que se usarán para predecir, para consistencia en la UI
      setPredictedPatientsData(allPatientsToPredict)

      if (allPatientsToPredict.length === 0) {
        setError("No hay pacientes con registros médicos completos para predecir.")
        setIsPredicting(false)
        return
      }

      // 3. Realizar las predicciones en bucle
      const results: PredictionResult[] = []
      console.log(`[MedicalDataImport] Iniciando predicción para ${allPatientsToPredict.length} pacientes.`)
      for (let i = 0; i < allPatientsToPredict.length; i++) {
        const patientData = allPatientsToPredict[i]
        try {
          const prediction = await predictionService.predict(patientData)
          results.push(prediction)
        } catch (err) {
          console.error(`Error prediciendo para DNI ${patientData.dni}:`, err)
        }
        setPredictionProgress(((i + 1) / allPatientsToPredict.length) * 100)
      }
      
      setPredictions(results)
      setSuccess(`Se realizaron ${results.length} predicciones de ${allPatientsToPredict.length} pacientes posibles.`)
      
    } catch (err: any) {
      setError("Error durante la predicción masiva: " + err.message)
      console.error("[MedicalDataImport] Error en predicción masiva:", err)
    } finally {
      setIsPredicting(false)
    }
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

  const exportPredictions = () => {
    const csvContent = [
      "Nombre,Apellidos,Edad,Riesgo,Probabilidad,Factores de Riesgo",
      ...predictions.map((p) => {
        const patient = predictedPatientsData.find(pp => pp.numero_historia === p.patient_id)
        const riskFactors = Array.isArray(p.factores) ? p.factores.join('; ') : 'N/A'
        return `${patient?.nombre || 'N/A'},${patient?.apellidos || 'N/A'},${patient?.edad || 'N/A'},${p.riesgo},${p.probabilidad.toFixed(1)}%,${riskFactors}`
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "predicciones_masivas.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPatients = processedPatients.length + existingPatientsCount

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
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-gray-700 font-medium">
                Cargar archivo de datos
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    processFileData(file)
                  }
                }}
                className="border-gray-300 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Formatos soportados: CSV, JSON, TXT</p>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando archivo...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}

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

      {/* Datos procesados y predicciones */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datos Procesados y Predicciones
          </CardTitle>
          <CardDescription className="text-emerald-100">Registros médicos integrados y análisis predictivo</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todos ({totalPatients})</TabsTrigger>
              <TabsTrigger value="existing">Existentes ({existingPatientsCount})</TabsTrigger>
              <TabsTrigger value="imported">Importados ({processedPatients.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">{totalPatients} pacientes totales</div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleMassPrediction} 
                    disabled={isPredicting || totalPatients === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isPredicting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    {isPredicting ? "Prediciendo..." : "Predecir Masivamente"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadExistingPatients} disabled={isLoadingExisting}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingExisting ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>

              {isPredicting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Realizando predicciones...</span>
                    <span>{Math.round(predictionProgress)}%</span>
                  </div>
                  <Progress value={predictionProgress} className="w-full" />
                </div>
              )}

              {predictions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800">Resultados de Predicciones</h4>
                    <Button size="sm" variant="outline" onClick={exportPredictions}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Predicciones
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {predictions.slice(0, 10).map((prediction, index) => {
                      const patient = predictedPatientsData.find(p => p.numero_historia === prediction.patient_id)
                      return (
                        <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{patient?.nombre || 'Paciente'}</div>
                              <div className="text-sm text-gray-600">
                                Edad: {patient?.edad} | Probabilidad: {prediction.probabilidad.toFixed(1)}%
                              </div>
                            </div>
                            <Badge
                              variant={
                                prediction.riesgo === "Alto"
                                  ? "destructive"
                                  : prediction.riesgo === "Medio"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {prediction.riesgo}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                    {predictions.length > 10 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Y {predictions.length - 10} predicciones más...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {totalPatients === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">No hay pacientes disponibles</div>
                  <div className="text-sm text-gray-500">Importe archivos o registre pacientes para comenzar el análisis</div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800">Resumen de Pacientes</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Pacientes Existentes</div>
                      <div className="text-2xl font-bold text-blue-600">{existingPatientsCount}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Pacientes Importados</div>
                      <div className="text-2xl font-bold text-green-600">{processedPatients.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              {isLoadingExisting ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <div className="text-gray-600">Cargando pacientes existentes...</div>
                </div>
              ) : existingPatientsCount > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800">Pacientes Registrados ({existingPatientsCount})</h4>
                  {displayExistingPatients.map((patient, index) => (
                    <div key={patient.id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{patient.nombre} {patient.apellidos}</div>
                          <div className="text-sm text-gray-600">
                            Edad: {patient.edad} | DNI: {patient.dni}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {existingPatientsCount > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      Y {existingPatientsCount - 10} pacientes más...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">No hay pacientes registrados</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="imported" className="space-y-4">
              {processedPatients.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800">Pacientes Importados</h4>
                  {processedPatients.slice(0, 10).map((patient, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{patient.nombre} {patient.apellidos}</div>
                          <div className="text-sm text-gray-600">
                            Edad: {patient.edad} | Presión: {patient.presionSistolica}/{patient.presionDiastolica}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {processedPatients.length > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      Y {processedPatients.length - 10} pacientes más...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">No hay pacientes importados</div>
                  <div className="text-sm text-gray-500">Importe archivos de datos médicos para comenzar</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
