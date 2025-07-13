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
import { predictionService, type PredictionResult } from "@/lib/services/predictions"
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
  fecha_nacimiento: string  // Cambiado de edad a fecha_nacimiento
  sexo: string
  peso: string              // Cambiado a string para coincidir con formulario
  altura: string            // Cambiado a string para coincidir con formulario
  presion_sistolica: string // Cambiado a snake_case y string
  presion_diastolica: string // Cambiado a snake_case y string
  frecuencia_cardiaca: string // Agregado campo faltante
  colesterol: string        // Cambiado a string
  glucosa: string           // Cambiado a string
  cigarrillos_dia: string   // Cambiado a snake_case y string
  anos_tabaquismo: string   // Cambiado a snake_case y string
  actividad_fisica: string  // Cambiado a snake_case
  antecedentes_cardiacos: string // Cambiado a snake_case
  diabetes: string          // Agregado campo faltante
  hipertension: string      // Agregado campo faltante
  numero_historia: string
}

interface ImportedPatient {
  nombre: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: string;
  peso: number;
  altura: number;
  presion_sistolica: number;
  presion_diastolica: number;
  colesterol?: number;
  glucosa?: number;
  cigarrillos_dia: number;
  anos_tabaquismo: number;
  actividad_fisica: string;
  antecedentes_cardiacos: string;
  diabetes: boolean;
  hipertension: boolean;
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
        fecha_nacimiento: patient.fecha_nacimiento || patient.birth_date || patient.birthdate || "",
        sexo: patient.sexo || patient.gender || "M",
        peso: patient.peso || patient.weight || "0",
        altura: patient.altura || patient.height || "0",
        presion_sistolica: patient.presion_sistolica || patient.presion_diastolica || patient.presion_diastolica || "0",
        presion_diastolica: patient.presion_diastolica || patient.presion_diastolica || patient.presion_diastolica || "0",
        frecuencia_cardiaca: patient.frecuencia_cardiaca || patient.heart_rate || "0",
        colesterol: patient.colesterol || patient.cholesterol || "0",
        glucosa: patient.glucosa || patient.glucose || "0",
        cigarrillos_dia: patient.cigarrillos_dia || patient.cigarettes || "0",
        anos_tabaquismo: patient.anos_tabaquismo || patient.smoking_years || "0",
        actividad_fisica: patient.actividad_fisica || patient.physical_activity || "sedentario",
        antecedentes_cardiacos: patient.antecedentes_cardiacos || patient.family_history || "no",
        diabetes: patient.diabetes || "no",
        hipertension: patient.hipertension || "no",
        numero_historia: patient.historia || patient.medical_record || `HC${Date.now()}${i}`
      }
      
      // Validar datos mínimos requeridos
      if (processedPatient.nombre && processedPatient.fecha_nacimiento) {
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
        fecha_nacimiento: patient.fecha_nacimiento || patient.birth_date || patient.birthdate || "",
        sexo: patient.sexo || patient.gender || "M",
        peso: patient.peso || patient.weight || "0",
        altura: patient.altura || patient.height || "0",
        presion_sistolica: patient.presion_sistolica || patient.presion_diastolica || patient.presion_diastolica || "0",
        presion_diastolica: patient.presion_diastolica || patient.presion_diastolica || patient.presion_diastolica || "0",
        frecuencia_cardiaca: patient.frecuencia_cardiaca || patient.heart_rate || "0",
        colesterol: patient.colesterol || patient.cholesterol || "0",
        glucosa: patient.glucosa || patient.glucose || "0",
        cigarrillos_dia: patient.cigarrillos_dia || patient.cigarettes || "0",
        anos_tabaquismo: patient.anos_tabaquismo || patient.smoking_years || "0",
        actividad_fisica: patient.actividad_fisica || patient.physical_activity || "sedentario",
        antecedentes_cardiacos: patient.antecedentes_cardiacos || patient.family_history || "no",
        diabetes: patient.diabetes || "no",
        hipertension: patient.hipertension || "no",
        numero_historia: patient.numero_historia || patient.medical_record || `HC${Date.now()}${index}`
      }
      
      if (processedPatient.nombre && processedPatient.fecha_nacimiento) {
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
        console.log(`[MedicalDataImport] Procesando paciente ${i + 1}/${allPatientsToPredict.length}:`, {
          dni: patientData.dni,
          nombre: patientData.nombre,
          apellidos: patientData.apellidos,
          peso: patientData.peso,
          altura: patientData.altura,
          presion_sistolica: patientData.presion_sistolica,
          presion_diastolica: patientData.presion_diastolica,
          colesterol: patientData.colesterol,
          glucosa: patientData.glucosa,
          cigarrillos_dia: patientData.cigarrillos_dia,
          anos_tabaquismo: patientData.anos_tabaquismo,
          actividad_fisica: patientData.actividad_fisica,
          antecedentes_cardiacos: patientData.antecedentes_cardiacos,
          diabetes: patientData.diabetes,
          hipertension: patientData.hipertension
        });
        
        try {
          const prediction = await predictionService.predict(patientData)
          results.push(prediction)
        } catch (err) {
          console.error(`[MedicalDataImport] Error prediciendo para DNI ${patientData.dni}:`, err);
          if (err && typeof err === 'object' && 'response' in err && (err as any).response) {
            const response = (err as any).response;
            console.error(`[MedicalDataImport] Detalles del error para DNI ${patientData.dni}:`, {
              status: response.status,
              data: response.data,
              headers: response.headers
            });
          }
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

  // Función para validar un paciente
  function validarPaciente(paciente: ProcessedPatient) {
    const errores = [];
    if (!paciente.nombre) errores.push("Falta el nombre");
    if (!paciente.apellidos) errores.push("Faltan los apellidos");
    if (!paciente.dni || paciente.dni.length !== 8) errores.push("DNI inválido");
    if (!paciente.fecha_nacimiento) errores.push("Falta la fecha de nacimiento");
    if (!paciente.sexo || !["M", "F"].includes(paciente.sexo)) errores.push("Sexo inválido");
    if (!paciente.peso || isNaN(Number(paciente.peso)) || Number(paciente.peso) <= 0) errores.push("Peso inválido");
    if (!paciente.altura || isNaN(Number(paciente.altura)) || Number(paciente.altura) <= 0) errores.push("Altura inválida");
    if (!paciente.presion_sistolica || isNaN(Number(paciente.presion_sistolica))) errores.push("Presión sistólica inválida");
    if (!paciente.presion_diastolica || isNaN(Number(paciente.presion_diastolica))) errores.push("Presión diastólica inválida");
    if (!paciente.frecuencia_cardiaca || isNaN(Number(paciente.frecuencia_cardiaca))) errores.push("Frecuencia cardíaca inválida");
    if (!paciente.colesterol || isNaN(Number(paciente.colesterol))) errores.push("Colesterol inválido");
    if (!paciente.glucosa || isNaN(Number(paciente.glucosa))) errores.push("Glucosa inválida");
    if (paciente.cigarrillos_dia === undefined || isNaN(Number(paciente.cigarrillos_dia))) errores.push("Cigarrillos/día inválido");
    if (paciente.anos_tabaquismo === undefined || isNaN(Number(paciente.anos_tabaquismo))) errores.push("Años de tabaquismo inválido");
    if (!paciente.actividad_fisica) errores.push("Actividad física faltante");
    if (!paciente.antecedentes_cardiacos) errores.push("Antecedentes cardíacos faltante");
    if (!paciente.diabetes || !["si", "no"].includes(paciente.diabetes)) errores.push("Diabetes inválido");
    if (!paciente.hipertension || !["si", "no"].includes(paciente.hipertension)) errores.push("Hipertensión inválido");
    if (!paciente.numero_historia) errores.push("Número de historia clínica faltante");
    return errores;
  }

  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Función para validar todos los pacientes antes de predecir
  const validarAntesDePredecir = () => {
    const erroresPorPaciente = processedPatients.map((p, idx) => ({
      idx,
      dni: p.dni,
      nombre: p.nombre,
      errores: validarPaciente(p)
    })).filter(p => p.errores.length > 0);
    setValidationErrors(erroresPorPaciente);
    return erroresPorPaciente.length === 0;
  };

  // Modificar handleMassPrediction para validar antes de predecir
  const handleValidarYPredecir = async () => {
    if (!validarAntesDePredecir()) {
      setError("Hay pacientes con datos incompletos o inválidos. Corrige los errores antes de predecir.");
      return;
    }
    setError("");
    await handleMassPrediction();
  };

  const exportData = () => {
    const csvContent = [
      "Nombre,Fecha de Nacimiento,Presión,Colesterol,Riesgo",
      ...importedPatients.map((p) => `${p.nombre},${p.fecha_nacimiento},${p.presion_sistolica}/${p.presion_diastolica},${p.colesterol || "N/A"},${p.riesgo}`),
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
      "Nombre,Apellidos,Fecha de Nacimiento,Riesgo,Probabilidad,Factores de Riesgo",
      ...predictions.map((p) => {
        const patient = predictedPatientsData.find(pp => pp.numero_historia === p.patient_id)
        const riskFactors = Array.isArray(p.factores) ? p.factores.join('; ') : 'N/A'
        return `${patient?.nombre || 'N/A'},${patient?.apellidos || 'N/A'},${patient?.fecha_nacimiento || 'N/A'},${p.riesgo_nivel},${p.probabilidad.toFixed(1)}%,${riskFactors}`
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

  const calculateAge = (fechaNacimiento: string | undefined): number => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Importación de datos */}
      <Card className="shadow-xl border-0 bg-white dark:bg-gray-900 dark:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg dark:from-gray-900 dark:to-gray-800">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Datos Médicos
          </CardTitle>
          <CardDescription className="text-indigo-100 dark:text-indigo-300">Integre registros médicos existentes al sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 dark:bg-gray-900/80">
          {error && (
            <Alert variant="destructive" className="dark:bg-red-900/40 dark:border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="dark:bg-green-900/40 dark:border-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="dark:text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-gray-700 font-medium dark:text-gray-200">
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
                className="border-gray-300 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Formatos soportados: CSV, JSON, TXT</p>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="dark:text-gray-200">Procesando archivo...</span>
                  <span className="dark:text-gray-200">{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full dark:bg-gray-800 dark:[&>div]:bg-indigo-600" />
              </div>
            )}

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 dark:text-gray-400">O</div>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <FileText className="mr-2 h-4 w-4" />
                    Pegar datos manualmente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl dark:bg-gray-900 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">Importar Datos Médicos</DialogTitle>
                    <DialogDescription className="dark:text-gray-300">
                      Pegue los datos médicos en formato CSV o texto separado por comas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Ejemplo:&#10;Juan Pérez,45,140/90,220,Masculino&#10;María García,38,120/80,180,Femenino&#10;..."
                      value={medicalData}
                      onChange={(e) => setMedicalData(e.target.value)}
                      className="min-h-[200px] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleProcessData} className="flex-1 dark:bg-indigo-700 dark:text-white">
                        <Database className="mr-2 h-4 w-4" />
                        Procesar Datos
                      </Button>
                      <Button variant="outline" onClick={() => setShowImportDialog(false)} className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Formatos de Integración:</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer dark:bg-blue-900/30 dark:hover:bg-blue-900/50">
                <div className="font-medium text-blue-800 dark:text-blue-200">Sistema HIS/EMR</div>
                <div className="text-sm text-blue-600 dark:text-blue-300">Integración directa con sistemas hospitalarios</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer dark:bg-green-900/30 dark:hover:bg-green-900/50">
                <div className="font-medium text-green-800 dark:text-green-200">API REST</div>
                <div className="text-sm text-green-600 dark:text-green-300">Conexión en tiempo real con bases de datos</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer dark:bg-purple-900/30 dark:hover:bg-purple-900/50">
                <div className="font-medium text-purple-800 dark:text-purple-200">HL7 FHIR</div>
                <div className="text-sm text-purple-600 dark:text-purple-300">Estándar internacional de interoperabilidad</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos procesados y predicciones */}
      <Card className="shadow-xl border-0 bg-white dark:bg-gray-900 dark:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg dark:from-gray-900 dark:to-gray-800">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datos Procesados y Predicciones
          </CardTitle>
          <CardDescription className="text-emerald-100 dark:text-emerald-300">Registros médicos integrados y análisis predictivo</CardDescription>
        </CardHeader>
        <CardContent className="p-6 dark:bg-gray-900/80">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800 dark:border-gray-700">
              <TabsTrigger value="all" className="dark:text-gray-100">Todos ({totalPatients})</TabsTrigger>
              <TabsTrigger value="existing" className="dark:text-gray-100">Existentes ({existingPatientsCount})</TabsTrigger>
              <TabsTrigger value="imported" className="dark:text-gray-100">Importados ({processedPatients.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">{totalPatients} pacientes totales</div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleValidarYPredecir} 
                    disabled={isPredicting || totalPatients === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-900 dark:to-pink-900 dark:hover:from-purple-800 dark:hover:to-pink-800 dark:text-white"
                  >
                    {isPredicting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    {isPredicting ? "Prediciendo..." : "Predecir Masivamente"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadExistingPatients} disabled={isLoadingExisting} className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingExisting ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>

              {isPredicting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-200">Realizando predicciones...</span>
                    <span className="dark:text-gray-200">{Math.round(predictionProgress)}%</span>
                  </div>
                  <Progress value={predictionProgress} className="w-full dark:bg-gray-800 dark:[&>div]:bg-emerald-600" />
                </div>
              )}

              {predictions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Resultados de Predicciones</h4>
                    <Button size="sm" variant="outline" onClick={exportPredictions} className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Predicciones
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {predictions.slice(0, 10).map((prediction, index) => {
                      const patient = predictedPatientsData.find(p => p.numero_historia === prediction.patient_id)
                      return (
                        <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 dark:from-gray-800 dark:to-purple-900 dark:border-blue-900">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium dark:text-gray-100">{patient?.nombre || 'Paciente'}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Edad: {calculateAge(patient?.fecha_nacimiento || "")} | Probabilidad: {prediction.probabilidad.toFixed(1)}%
                              </div>
                            </div>
                            <Badge
                              variant={
                                prediction.riesgo_nivel === "Alto"
                                  ? "destructive"
                                  : prediction.riesgo_nivel === "Medio"
                                    ? "default"
                                    : "secondary"
                              }
                              className={
                                prediction.riesgo_nivel === "Alto"
                                  ? "dark:bg-red-900 dark:text-red-200"
                                  : prediction.riesgo_nivel === "Medio"
                                    ? "dark:bg-yellow-900 dark:text-yellow-200"
                                    : "dark:bg-green-900 dark:text-green-200"
                              }
                            >
                              {prediction.riesgo_nivel}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                    {predictions.length > 10 && (
                      <div className="text-center text-sm text-gray-500 py-2 dark:text-gray-400">
                        Y {predictions.length - 10} predicciones más...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {totalPatients === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600 dark:text-gray-300">No hay pacientes disponibles</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Importe archivos o registre pacientes para comenzar el análisis</div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">Resumen de Pacientes</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/30">
                      <div className="font-medium text-blue-800 dark:text-blue-200">Pacientes Existentes</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-200">{existingPatientsCount}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg dark:bg-green-900/30">
                      <div className="font-medium text-green-800 dark:text-green-200">Pacientes Importados</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-200">{processedPatients.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              {isLoadingExisting ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <div className="text-gray-600 dark:text-gray-300">Cargando pacientes existentes...</div>
                </div>
              ) : existingPatientsCount > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">Pacientes Registrados ({existingPatientsCount})</h4>
                  {displayExistingPatients.map((patient, index) => (
                    <div key={patient.id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium dark:text-gray-100">{patient.nombre} {patient.apellidos}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Edad: {calculateAge(patient.fecha_nacimiento)} | DNI: {patient.dni}
                          </div>
                        </div>
                        <Badge variant="outline" className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
                          {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {existingPatientsCount > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2 dark:text-gray-400">
                      Y {existingPatientsCount - 10} pacientes más...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600 dark:text-gray-300">No hay pacientes registrados</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="imported" className="space-y-4">
              {processedPatients.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">Pacientes Importados</h4>
                  {processedPatients.slice(0, 10).map((patient, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium dark:text-gray-100">{patient.nombre} {patient.apellidos}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Edad: {calculateAge(patient.fecha_nacimiento)} | Presión: {patient.presion_sistolica}/{patient.presion_diastolica}
                          </div>
                        </div>
                        <Badge variant="outline" className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
                          {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {processedPatients.length > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2 dark:text-gray-400">
                      Y {processedPatients.length - 10} pacientes más...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600 dark:text-gray-300">No hay pacientes importados</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Importe archivos de datos médicos para comenzar</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 rounded-lg">
          <div className="font-bold text-red-700 dark:text-red-200 mb-2">Pacientes con datos inválidos:</div>
          <ul className="text-red-700 dark:text-red-200 text-sm space-y-2">
            {validationErrors.map((p: any, i: number) => (
              <li key={i}>
                <span className="font-semibold">{p.nombre} (DNI: {p.dni}):</span>
                <ul className="ml-4 list-disc">
                  {p.errores.map((err: string, j: number) => (
                    <li key={j}>{err}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
