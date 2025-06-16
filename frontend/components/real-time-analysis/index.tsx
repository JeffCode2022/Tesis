import { Scale, TrendingUp, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface FormData {
  peso: string
  altura: string
  presionSistolica: string
  presionDiastolica: string
  cigarrillosDia: string
  anosTabaquismo: string
}

interface RiskDistribution {
  riesgo_nivel: string
  count: number
}

interface AgeDistribution {
  rango: string
  bajo: number
  medio: number
  alto: number
}

interface MonthlyEvolution {
  mes: string
  predicciones: number
  precision: number
}

interface RiskFactor {
  factor: string
  pacientes: number
  porcentaje: number
}

interface RealTimeAnalysisProps {
  formData?: FormData
  data?: RiskDistribution[] | AgeDistribution[] | MonthlyEvolution[] | RiskFactor[]
  type?: 'risk' | 'age' | 'monthly' | 'factors'
}

const COLORS = ['#4CAF50', '#FFC107', '#F44336']

export function RealTimeAnalysis({ formData, data, type = 'risk' }: RealTimeAnalysisProps) {
  if (formData) {
    return <FormAnalysis formData={formData} />
  }

  if (!data) return null

  switch (type) {
    case 'risk':
      return <RiskDistributionChart data={data as RiskDistribution[]} />
    case 'age':
      return <AgeDistributionChart data={data as AgeDistribution[]} />
    case 'monthly':
      return <MonthlyEvolutionChart data={data as MonthlyEvolution[]} />
    case 'factors':
      return <RiskFactorsChart data={data as RiskFactor[]} />
    default:
      return null
  }
}

function FormAnalysis({ formData }: { formData: FormData }) {
  const calcularIMC = () => {
    if (formData.peso && formData.altura) {
      const peso = Number.parseFloat(formData.peso)
      const altura = Number.parseFloat(formData.altura) / 100
      return (peso / (altura * altura)).toFixed(1)
    }
    return ""
  }

  const calcularBRI = () => {
    if (formData.peso && formData.altura) {
      const peso = Number.parseFloat(formData.peso)
      const altura = Number.parseFloat(formData.altura) / 100
      const imc = peso / (altura * altura)
      return (imc * 1.2).toFixed(1)
    }
    return ""
  }

  const calcularPresionArterial = () => {
    if (formData.presionSistolica && formData.presionDiastolica) {
      const sistolica = Number.parseInt(formData.presionSistolica)
      const diastolica = Number.parseInt(formData.presionDiastolica)
      return sistolica - diastolica
    }
    return ""
  }

  const calcularIndicePaquetes = () => {
    if (formData.cigarrillosDia && formData.anosTabaquismo) {
      const cigarrillos = Number.parseInt(formData.cigarrillosDia)
      const anos = Number.parseInt(formData.anosTabaquismo)
      return ((cigarrillos / 20) * anos).toFixed(1)
    }
    return ""
  }

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { category: "Bajo peso", color: "text-blue-600", bg: "bg-blue-50" }
    if (imc < 25) return { category: "Normal", color: "text-green-600", bg: "bg-green-50" }
    if (imc < 30) return { category: "Sobrepeso", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { category: "Obesidad", color: "text-red-600", bg: "bg-red-50" }
  }

  const getPresionCategory = (sistolica: number) => {
    if (sistolica < 120) return { category: "Normal", color: "text-green-600", bg: "bg-green-50" }
    if (sistolica < 140) return { category: "Elevada", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { category: "Hipertensión", color: "text-red-600", bg: "bg-red-50" }
  }

  const getBRICategory = (bri: number) => {
    if (bri < 3.41) return { category: "Bajo", color: "text-green-600", bg: "bg-green-50" }
    if (bri < 5.46) return { category: "Moderado", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { category: "Alto", color: "text-red-600", bg: "bg-red-50" }
  }

  const getTabaquismoCategory = (paquetes: number) => {
    if (paquetes === 0) return { category: "No fumador", color: "text-green-600", bg: "bg-green-50" }
    if (paquetes < 10) return { category: "Fumador ligero", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (paquetes < 20) return { category: "Fumador moderado", color: "text-orange-600", bg: "bg-orange-50" }
    return { category: "Fumador severo", color: "text-red-600", bg: "bg-red-50" }
  }

  const imc = calcularIMC()
  const bri = calcularBRI()
  const presionDiferencial = calcularPresionArterial()
  const indicePaquetes = calcularIndicePaquetes()

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Análisis en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* IMC */}
          <div
            className={`p-4 rounded-xl transition-all duration-300 ${
              imc ? getIMCCategory(Number.parseFloat(imc)).bg : "bg-gray-50"
            }`}
          >
            <Label
              className={`text-sm font-medium ${imc ? getIMCCategory(Number.parseFloat(imc)).color : "text-gray-500"}`}
            >
              Índice de Masa Corporal
            </Label>
            <div
              className={`text-2xl font-bold ${imc ? getIMCCategory(Number.parseFloat(imc)).color : "text-gray-400"}`}
            >
              {imc || "--"}
            </div>
            <p className="text-xs text-gray-600">{imc ? getIMCCategory(Number.parseFloat(imc)).category : "kg/m²"}</p>
          </div>

          {/* BRI */}
          <div
            className={`p-4 rounded-xl transition-all duration-300 ${
              bri ? getBRICategory(Number.parseFloat(bri)).bg : "bg-gray-50"
            }`}
          >
            <Label
              className={`text-sm font-medium ${bri ? getBRICategory(Number.parseFloat(bri)).color : "text-gray-500"}`}
            >
              Índice de Redondez Corporal
            </Label>
            <div
              className={`text-2xl font-bold ${bri ? getBRICategory(Number.parseFloat(bri)).color : "text-gray-400"}`}
            >
              {bri || "--"}
            </div>
            <p className="text-xs text-gray-600">
              {bri ? getBRICategory(Number.parseFloat(bri)).category : "BRI Score"}
            </p>
          </div>

          {/* Presión Arterial */}
          <div
            className={`p-4 rounded-xl transition-all duration-300 ${
              formData.presionSistolica
                ? getPresionCategory(Number.parseInt(formData.presionSistolica)).bg
                : "bg-gray-50"
            }`}
          >
            <Label
              className={`text-sm font-medium ${
                formData.presionSistolica
                  ? getPresionCategory(Number.parseInt(formData.presionSistolica)).color
                  : "text-gray-500"
              }`}
            >
              Presión Diferencial
            </Label>
            <div
              className={`text-2xl font-bold ${
                formData.presionSistolica
                  ? getPresionCategory(Number.parseInt(formData.presionSistolica)).color
                  : "text-gray-400"
              }`}
            >
              {presionDiferencial || "--"}
            </div>
            <p className="text-xs text-gray-600">
              {formData.presionSistolica
                ? getPresionCategory(Number.parseInt(formData.presionSistolica)).category
                : "mmHg"}
            </p>
          </div>

          {/* Índice Tabaquismo */}
          <div
            className={`p-4 rounded-xl transition-all duration-300 ${
              indicePaquetes ? getTabaquismoCategory(Number.parseFloat(indicePaquetes)).bg : "bg-gray-50"
            }`}
          >
            <Label
              className={`text-sm font-medium ${
                indicePaquetes ? getTabaquismoCategory(Number.parseFloat(indicePaquetes)).color : "text-gray-500"
              }`}
            >
              Índice Paquetes/Año
            </Label>
            <div
              className={`text-2xl font-bold ${
                indicePaquetes ? getTabaquismoCategory(Number.parseFloat(indicePaquetes)).color : "text-gray-400"
              }`}
            >
              {indicePaquetes || "0"}
            </div>
            <p className="text-xs text-gray-600">
              {indicePaquetes
                ? getTabaquismoCategory(Number.parseFloat(indicePaquetes)).category
                : "Exposición tabáquica"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RiskDistributionChart({ data }: { data: RiskDistribution[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="riesgo_nivel"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function AgeDistributionChart({ data }: { data: AgeDistribution[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rango" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="bajo" name="Riesgo Bajo" fill="#4CAF50" />
          <Bar dataKey="medio" name="Riesgo Medio" fill="#FFC107" />
          <Bar dataKey="alto" name="Riesgo Alto" fill="#F44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MonthlyEvolutionChart({ data }: { data: MonthlyEvolution[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="predicciones"
            name="Predicciones"
            stroke="#4CAF50"
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="precision"
            name="Precisión (%)"
            stroke="#2196F3"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function RiskFactorsChart({ data }: { data: RiskFactor[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="factor" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pacientes" name="Pacientes" fill="#4CAF50" />
          <Bar dataKey="porcentaje" name="Porcentaje" fill="#2196F3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
