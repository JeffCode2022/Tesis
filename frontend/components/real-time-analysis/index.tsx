import { Scale } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface FormData {
  peso: string
  altura: string
  presionSistolica: string
  presionDiastolica: string
  cigarrillosDia: string
  anosTabaquismo: string
}

interface RealTimeAnalysisProps {
  formData: FormData
}

export function RealTimeAnalysis({ formData }: RealTimeAnalysisProps) {
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
