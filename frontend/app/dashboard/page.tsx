"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from 'uuid'

// Import components
const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })
import { MetricsCards } from "@/components/metrics-cards"
import { PredictionForm } from "@/components/prediction-form"
import { RealTimeAnalysis } from "@/components/real-time-analysis"
import { PredictionResults } from "@/components/prediction-results"
import { MedicalDataImport } from "@/components/medical-data-import"
import { PatientsList } from "@/components/patients-list"

// Import services
import { predictionService, type PredictionResult, type PredictionData } from "@/lib/services/predictions"
import { patientService, type Patient } from "@/lib/services/patients"
import { analyticsService, type DashboardMetrics } from "@/lib/services/analytics"

// Import types

// Adaptador para convertir DashboardMetrics a MetricsData
const adaptMetrics = (metrics: DashboardMetrics) => ({
  total_patients: metrics.total_patients,
  total_predictions: metrics.total_predictions,
  high_risk_count: metrics.high_risk_count,
  monthly_growth: metrics.monthly_growth,
  previous_month_patients: 0,
  previous_month_predictions: 0,
  previous_month_high_risk: 0,
  previous_month_growth: 0
})

export default function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  // Estados
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_patients: 0,
    total_predictions: 0,
    high_risk_count: 0,
    monthly_growth: 0,
    risk_distribution: [
      { riesgo_nivel: "Bajo", count: 0 },
      { riesgo_nivel: "Medio", count: 0 },
      { riesgo_nivel: "Alto", count: 0 }
    ],
    age_risk_distribution: [
      { rango: "18-30", bajo: 0, medio: 0, alto: 0 },
      { rango: "31-45", bajo: 0, medio: 0, alto: 0 },
      { rango: "46-60", bajo: 0, medio: 0, alto: 0 },
      { rango: "60+", bajo: 0, medio: 0, alto: 0 }
    ],
    common_risk_factors: [],
    monthly_evolution: [],
    model_accuracy: 0
  })

  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    sexo: "",
    peso: "",
    altura: "",
    presionSistolica: "",
    presionDiastolica: "",
    colesterol: "",
    glucosa: "",
    cigarrillosDia: "",
    anosTabaquismo: "",
    actividadFisica: "",
    antecedentesCardiacos: "",
    apellidos: "",
    numero_historia: "",
  })

  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [importedPatients, setImportedPatients] = useState<Patient[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsData, metricsData] = await Promise.all([
          patientService.getPatients(),
          analyticsService.getDashboardMetrics()
        ])
        if (Array.isArray(patientsData)) {
          setPatients(patientsData)
        } else {
          console.error('API returned non-array data for patients:', patientsData)
          setPatients([]) // Fallback to empty array to prevent errors
        }
        setMetrics(metricsData)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Manejadores de eventos
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePredict = async () => {
    try {
      console.log('Value of formData.nombre before prediction:', formData.nombre)
      const predictionData: PredictionData = {
        ...formData,
        edad: Number(formData.edad),
        sexo: formData.sexo,
        peso: Number(formData.peso),
        altura: Number(formData.altura),
        presionSistolica: Number(formData.presionSistolica),
        presionDiastolica: Number(formData.presionDiastolica),
        colesterol: Number(formData.colesterol),
        glucosa: Number(formData.glucosa),
        cigarrillosDia: Number(formData.cigarrillosDia),
        anosTabaquismo: Number(formData.anosTabaquismo),
        actividadFisica: formData.actividadFisica,
        antecedentesCardiacos: formData.antecedentesCardiacos,
        apellidos: formData.apellidos,
        numero_historia: formData.numero_historia,
      }
      const result = await predictionService.predict(predictionData)
      setPrediction(result)
    } catch (error) {
      console.error('Error making prediction:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        try {
          const data = JSON.parse(content)
          if (Array.isArray(data)) {
            setImportedPatients(data)
          }
        } catch {
          processTextData(content)
        }
      }
      reader.readAsText(file)
    }
  }

  const processTextData = (content: string) => {
    try {
      const lines = content.split("\n").filter(line => line.trim())
      const processedData: Patient[] = lines.map((line, index) => {
        const values = line.split(",")
        return {
          id: uuidv4(),
          nombre: values[0] || `Paciente ${index + 1}`,
          edad: Number(values[1]) || Math.floor(Math.random() * 50) + 30,
          sexo: values[4] || (Math.random() > 0.5 ? "Masculino" : "Femenino"),
          peso: Number(values[5]) || Math.floor(Math.random() * 50) + 50,
          altura: Number(values[6]) || Math.floor(Math.random() * 50) + 150,
          riesgo: "Desconocido",
          apellidos: values[7] || "",
          numero_historia: values[8] || `HC-${index + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
      setImportedPatients(processedData)
    } catch (error) {
      console.error('Error processing text data:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header 
        modelAccuracy={95.8}
        userName={`${user?.first_name} ${user?.last_name}`}
        userRole="Médico"
      />
      <main className="container mx-auto p-4">
        <MetricsCards data={adaptMetrics(metrics)} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PredictionForm 
            formData={formData}
            onFormChange={handleFormChange}
            onPredict={handlePredict}
          />
          <RealTimeAnalysis formData={formData} />
        </div>
        {prediction && <PredictionResults prediction={prediction} />}
        <MedicalDataImport
          importedPatients={importedPatients}
          onFileUpload={handleFileUpload}
          onDataProcess={processTextData}
        />
        <PatientsList 
          patients={patients}
          importedPatients={importedPatients}
        />
      </main>
    </div>
  )
} 