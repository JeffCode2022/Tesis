import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface PredictionResult {
  riesgo: string
  probabilidad: number
  factores: string[]
  recomendaciones: string[]
}

interface PredictionResultsProps {
  prediction: PredictionResult
}

export function PredictionResults({ prediction }: PredictionResultsProps) {
  const getRiskColor = (riesgo: string) => {
    switch (riesgo) {
      case "Alto":
        return {
          header: "bg-gradient-to-r from-red-600 to-red-700",
          badge: "border-red-500 text-red-700 bg-red-50",
          progress: "[&>div]:bg-red-500",
        }
      case "Medio":
        return {
          header: "bg-gradient-to-r from-yellow-600 to-orange-600",
          badge: "border-yellow-500 text-yellow-700 bg-yellow-50",
          progress: "[&>div]:bg-yellow-500",
        }
      default:
        return {
          header: "bg-gradient-to-r from-green-600 to-emerald-600",
          badge: "border-green-500 text-green-700 bg-green-50",
          progress: "[&>div]:bg-green-500",
        }
    }
  }

  const colors = getRiskColor(prediction.riesgo || "Desconocido")

  return (
    <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className={`text-white rounded-t-lg ${colors.header}`}>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Resultado del Análisis IA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <Badge variant="outline" className={`text-lg px-6 py-3 border-2 ${colors.badge}`}>
            Riesgo {prediction.riesgo}
          </Badge>
          <div className="mt-6">
            <div className="text-4xl font-bold mb-3 text-gray-800">{prediction.probabilidad}%</div>
            <Progress value={prediction.probabilidad} className={`w-full h-3 ${colors.progress}`} />
            <p className="text-sm text-gray-600 mt-2">Probabilidad de desarrollar ECV en 10 años</p>
          </div>
        </div>

        <Separator />

        {/* Factores de riesgo */}
        {(prediction.factores && prediction.factores.length > 0) && (
          <div>
            <h4 className="font-semibold mb-3 text-gray-800">Factores de Riesgo Identificados:</h4>
            <div className="space-y-2">
              {prediction.factores.map((factor, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm text-orange-800">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Recomendaciones */}
        {(prediction.recomendaciones && prediction.recomendaciones.length > 0) && (
          <div>
            <h4 className="font-semibold mb-3 text-gray-800">Recomendaciones Personalizadas:</h4>
            <div className="space-y-2">
              {prediction.recomendaciones.map((recomendacion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-blue-800">{recomendacion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
