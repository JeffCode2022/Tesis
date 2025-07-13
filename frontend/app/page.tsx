"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { v4 as uuidv4 } from 'uuid'; // @ts-ignore
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// Definición de tipos para los mensajes
type MessageType = "bot" | "user"

interface Message {
  type: MessageType
  message: string
  timestamp: Date
}

// Import components
const Header = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: false })
import { MetricsCards } from "@/components/metrics-cards"
import { PredictionForm } from "@/components/prediction-form"
import { RealTimeAnalysis } from "@/components/real-time-analysis"
import { PredictionResults } from "@/components/prediction-results"
import { MedicalDataImport } from "@/components/medical-data-import"
import { PatientsList } from "@/components/patients-list"
import { CardioBot } from "@/components/cardio-bot"

// Import services
import { predictionService, type PredictionData, type PredictionResult } from "@/lib/services/predictions"
import { patientService, type Patient } from "@/lib/services/patients"
import { analyticsService, type RiskFactorData, type AgeDistributionData, type RiskDistributionData, type MonthlyPredictionData } from "@/lib/services/analytics"

// Import chart components
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Datos de ejemplo para gráficos (estos serán reemplazados por datos de la API)
const initialRiskFactorsData = [
  { factor: "IMC Elevado", pacientes: 45, porcentaje: 32, color: "#ef4444" },
  { factor: "Hipertensión", pacientes: 38, porcentaje: 27, color: "#f97316" },
  { factor: "Tabaquismo", pacientes: 28, porcentaje: 20, color: "#eab308" },
  { factor: "BRI Alto", pacientes: 30, porcentaje: 21, color: "#06b6d4" },
]

const initialAgeDistributionData = [
  { rango: "18-30", bajo: 15, medio: 8, alto: 2 },
  { rango: "31-45", bajo: 20, medio: 15, alto: 8 },
  { rango: "46-60", bajo: 12, medio: 25, alto: 18 },
  { rango: "60+", bajo: 5, medio: 20, alto: 35 },
]

const initialRiskDistributionData = [
  { name: "Bajo Riesgo", value: 52, color: "#10b981" },
  { name: "Riesgo Medio", value: 68, color: "#f59e0b" },
  { name: "Alto Riesgo", value: 63, color: "#ef4444" },
]

const initialMonthlyPredictionsData = [
  { mes: "Ene", predicciones: 45, precision: 94.2 },
  { mes: "Feb", predicciones: 52, precision: 95.1 },
  { mes: "Mar", predicciones: 48, precision: 93.8 },
  { mes: "Abr", predicciones: 61, precision: 96.3 },
  { mes: "May", predicciones: 55, precision: 94.7 },
  { mes: "Jun", predicciones: 67, precision: 97.1 },
]

// Datos iniciales de pacientes (solo para demostración, se cargarán de la API)
const initialPatientsData: Patient[] = []

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

type FormData = {
  nombre: string
  apellidos: string
  dni: string
  fecha_nacimiento: string
  sexo: string
  peso: string
  altura: string
  presionSistolica: string
  presionDiastolica: string
  colesterol: string
  glucosa: string
  cigarrillosDia: string
  anosTabaquismo: string
  actividadFisica: string
  antecedentesCardiacos: string
}

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!token) {
      router.replace('/login');
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 200);
    } else {
      router.replace('/dashboard');
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }, 200);
    }
  }, [router]);

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</div>
    </div>
  )
}
