"use client"

import { Users, Activity, AlertTriangle, Database, TrendingUp, Zap, Shield, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface MetricsData {
  total_patients: number
  total_predictions: number
  high_risk_count: number
  monthly_growth: number
  previous_month_patients?: number
  previous_month_predictions?: number
  previous_month_high_risk?: number
  previous_month_growth?: number
}

interface MetricsCardsProps {
  data: MetricsData
  className?: string
  onMetricClick?: (sectionId: string) => void
}

export function MetricsCards({ data, className, onMetricClick }: MetricsCardsProps) {
  const router = useRouter()

  const calculateGrowth = (current: number, previous?: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const metrics = [
    {
      title: "Total Pacientes",
      value: data.total_patients.toLocaleString(),
      icon: Users,
      gradient: "from-blue-600 to-blue-700",
      trend: calculateGrowth(data.total_patients, data.previous_month_patients),
      trendIcon: data.previous_month_patients ? 
        (data.total_patients > data.previous_month_patients ? ArrowUpRight : ArrowDownRight) : 
        TrendingUp,
      trendColor: data.previous_month_patients ? 
        (data.total_patients > data.previous_month_patients ? "text-green-300" : "text-red-300") : 
        "text-green-300",
      tooltip: "Número total de pacientes registrados en el sistema",
      onClick: () => onMetricClick?.('patients'),
    },
    {
      title: "Predicciones IA",
      value: data.total_predictions.toString(),
      icon: Activity,
      gradient: "from-emerald-600 to-emerald-700",
      trend: calculateGrowth(data.total_predictions, data.previous_month_predictions),
      trendIcon: data.previous_month_predictions ? 
        (data.total_predictions > data.previous_month_predictions ? ArrowUpRight : ArrowDownRight) : 
        Zap,
      trendColor: data.previous_month_predictions ? 
        (data.total_predictions > data.previous_month_predictions ? "text-green-300" : "text-red-300") : 
        "text-yellow-300",
      tooltip: "Total de predicciones realizadas por el modelo de IA",
    },
    {
      title: "Alto Riesgo",
      value: data.high_risk_count.toString(),
      icon: AlertTriangle,
      gradient: "from-orange-500 to-red-600",
      trend: calculateGrowth(data.high_risk_count, data.previous_month_high_risk),
      trendIcon: data.previous_month_high_risk ? 
        (data.high_risk_count > data.previous_month_high_risk ? ArrowUpRight : ArrowDownRight) : 
        Shield,
      trendColor: data.previous_month_high_risk ? 
        (data.high_risk_count > data.previous_month_high_risk ? "text-red-300" : "text-green-300") : 
        "text-orange-200",
      tooltip: "Pacientes identificados con alto riesgo cardiovascular",
    },
    {
      title: "Crecimiento Mensual",
      value: `${data.monthly_growth}%`,
      icon: Database,
      gradient: "from-purple-600 to-indigo-700",
      trend: calculateGrowth(data.monthly_growth, data.previous_month_growth),
      trendIcon: data.previous_month_growth ? 
        (data.monthly_growth > data.previous_month_growth ? ArrowUpRight : ArrowDownRight) : 
        FileText,
      trendColor: data.previous_month_growth ? 
        (data.monthly_growth > data.previous_month_growth ? "text-green-300" : "text-red-300") : 
        "text-green-300",
      tooltip: "Tasa de crecimiento mensual de pacientes",
    },
  ]

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", className)}>
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon
        const TrendIcon = metric.trendIcon

        return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
          <Card
            className={`bg-gradient-to-br ${metric.gradient} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${metric.onClick ? "cursor-pointer hover:scale-105" : ""}`}
            onClick={metric.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{metric.title}</CardTitle>
              <IconComponent className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendIcon className={`h-4 w-4 ${metric.trendColor}`} />
                      <p className="text-xs opacity-90">
                        {metric.trend !== 0 && (
                          <span className={metric.trendColor}>
                            {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                          </span>
                        )}
                        {metric.trend === 0 && "Sin cambios"}
                      </p>
              </div>
            </CardContent>
          </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
        )
      })}
    </div>
    </TooltipProvider>
  )
}
