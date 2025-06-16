"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from 'uuid'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Heart,
  Activity,
  Database
} from "lucide-react"

// Import components
const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })
import { MetricsCards } from "@/components/metrics-cards"
import { PredictionForm } from "@/components/prediction-form"
import { RealTimeAnalysis } from "@/components/real-time-analysis"
import { PredictionResults } from "@/components/prediction-results"
import { MedicalDataImport } from "@/components/medical-data-import"
import { PatientsList } from "@/components/patients-list"
import { Sidebar } from "@/components/sidebar"

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
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

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
    apellidos: "",
    dni: "",
    edad: "",
    sexo: "M",
    peso: "",
    altura: "",
    presionSistolica: "",
    presionDiastolica: "",
    colesterol: "",
    glucosa: "",
    cigarrillosDia: "",
    anosTabaquismo: "",
    actividadFisica: "sedentario",
    antecedentesCardiacos: "no",
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
    setMounted(true)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
      }
    }
  }, [])

  // Manejadores de eventos
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePredict = async () => {
    try {
      const predictionData: PredictionData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        dni: formData.dni,
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
        // Asumiendo el orden de los valores: nombre_completo, dni, edad, sexo, peso, altura, riesgo_actual, numero_historia, ultimo_registro
        const nombreCompleto = values[0] || `Paciente ${index + 1}`
        const [nombre, ...apellidosArray] = nombreCompleto.split(" ")
        const apellidos = apellidosArray.join(" ")

        const dni = values[1] || `${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` // Generar DNI aleatorio si no está presente
        const edad = Number(values[2]) || Math.floor(Math.random() * 50) + 30
        const sexo = values[3] || (Math.random() > 0.5 ? "M" : "F")
        const peso = Number(values[4]) || Math.floor(Math.random() * 50) + 50
        const altura = Number(values[5]) || Math.floor(Math.random() * 50) + 150
        const riesgoActual = values[6] || "Desconocido"
        const numeroHistoria = values[7] || `HC-${index + 1}`
        const ultimoRegistro = values[8] || new Date().toISOString()

        const imcCalculado = peso > 0 && altura > 0 ? (peso / ((altura / 100) * (altura / 100))).toFixed(2) : "N/A"

        return {
          id: uuidv4(),
          nombre: nombre,
          apellidos: apellidos,
          dni: dni, // Añadido campo DNI
          edad: edad,
          sexo: sexo,
          peso: peso,
          altura: altura,
          imc: parseFloat(imcCalculado) || undefined,
          riesgo_actual: riesgoActual,
          numero_historia: numeroHistoria,
          created_at: new Date().toISOString(),
          updated_at: ultimoRegistro,
          ultimo_registro: ultimoRegistro,
        }
      })
      setImportedPatients(processedData)
    } catch (error) {
      console.error('Error processing text data:', error)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'predictions', label: 'Predicciones', icon: Activity },
    { id: 'import', label: 'Importar Datos', icon: Database },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'analytics', label: 'Analíticas', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <MetricsCards data={adaptMetrics(metrics)} onMetricClick={setActiveSection} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Accuracy and Risk Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Precisión del Modelo y Distribución de Riesgo</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Precisión Actual del Modelo</span>
                    <span className="text-2xl font-bold text-blue-600">{metrics.model_accuracy.toFixed(2)}%</span>
                  </div>
                  <div className="h-[300px]">
                    <RealTimeAnalysis data={metrics.risk_distribution} type="risk" />
                  </div>
                </div>
              </div>

              {/* Age Risk Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Distribución de Riesgo por Edad</h3>
                <div className="h-[300px]">
                  <RealTimeAnalysis data={metrics.age_risk_distribution} type="age" />
                </div>
              </div>

              {/* Monthly Evolution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Evolución Mensual</h3>
                <div className="h-[300px]">
                  <RealTimeAnalysis data={metrics.monthly_evolution} type="monthly" />
                </div>
              </div>

              {/* Common Risk Factors */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Factores de Riesgo Comunes</h3>
                <div className="h-[300px]">
                  <RealTimeAnalysis data={metrics.common_risk_factors} type="factors" />
                </div>
              </div>
            </div>
          </div>
        )
      case 'patients':
        return <PatientsList importedPatients={importedPatients} />
      case 'predictions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Nueva Predicción</h3>
              <PredictionForm 
                formData={formData}
                onFormChange={handleFormChange}
                onPredict={handlePredict}
              />
            </div>
            {prediction && (
              <div className="bg-white rounded-lg shadow p-6">
                <PredictionResults prediction={prediction} />
              </div>
            )}
          </div>
        )
      case 'import':
        return (
          <MedicalDataImport
            importedPatients={importedPatients}
            onFileUpload={handleFileUpload}
            onDataProcess={processTextData}
          />
        )
      case 'reports':
        return <div className="p-4">Reportes en desarrollo...</div>
      case 'analytics':
        return <div className="p-4">Analíticas en desarrollo...</div>
      case 'settings':
        return <div className="p-4">Configuración en desarrollo...</div>
      default:
        return null
    }
  }

  if (!mounted) {
    return null
  }

  if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
    return <div>Cargando...</div>;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        modelAccuracy={95.8}
        userName={`${user?.first_name} ${user?.last_name}`}
        userRole="Médico"
      />
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
} 