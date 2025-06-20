"use client"

import { Users, Activity, TrendingUp, Shield, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
      title: "Pacientes Hoy",
      value: data.total_patients.toLocaleString(),
      icon: Users,
      iconColor: "text-white",
      iconBg: "bg-[#4ECDC4]",
      trend: calculateGrowth(data.total_patients, data.previous_month_patients),
      trendIcon: data.previous_month_patients
        ? data.total_patients > data.previous_month_patients
          ? ArrowUpRight
          : ArrowDownRight
        : TrendingUp,
      trendColor: data.previous_month_patients
        ? data.total_patients > data.previous_month_patients
          ? "text-green-600"
          : "text-red-500"
        : "text-green-600",
      trendText: "vs ayer",
      tooltip: "Número total de pacientes registrados en el sistema",
      onClick: () => onMetricClick?.("patients"),
    },
    {
      title: "Riesgo Alto",
      value: data.high_risk_count.toString(),
      icon: Activity,
      iconColor: "text-white",
      iconBg: "bg-red-500",
      trend: calculateGrowth(data.high_risk_count, data.previous_month_high_risk),
      trendIcon: data.previous_month_high_risk
        ? data.high_risk_count > data.previous_month_high_risk
          ? ArrowUpRight
          : ArrowDownRight
        : Shield,
      trendColor: data.previous_month_high_risk
        ? data.high_risk_count > data.previous_month_high_risk
          ? "text-red-500"
          : "text-green-600"
        : "text-red-500",
      trendText: "nuevos casos",
      tooltip: "Pacientes identificados con alto riesgo cardiovascular",
    },
    {
      title: "Precisión IA",
      value: `${data.monthly_growth}%`,
      icon: BarChart3,
      iconColor: "text-white",
      iconBg: "bg-green-500",
      trend: calculateGrowth(data.monthly_growth, data.previous_month_growth),
      trendIcon: data.previous_month_growth
        ? data.monthly_growth > data.previous_month_growth
          ? ArrowUpRight
          : ArrowDownRight
        : TrendingUp,
      trendColor: data.previous_month_growth
        ? data.monthly_growth > data.previous_month_growth
          ? "text-green-600"
          : "text-red-500"
        : "text-green-600",
      trendText: "esta semana",
      tooltip: "Precisión del modelo de IA en las predicciones",
    },
  ]

  return (
    <div className="relative min-h-[200px] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700 p-6 rounded-2xl shadow-2xl">
      {/* Background blur elements for glassmorphism */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-[#4ECDC4]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[150px] h-[150px] bg-blue-200/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/3 w-[100px] h-[100px] bg-green-200/15 rounded-full blur-xl"></div>
      </div>

      <TooltipProvider>
        <div className={cn("relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card
                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
                    onClick={metric.onClick}
                  >
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-gray-900/40 to-white/10 dark:to-gray-900/10 pointer-events-none" />

                    <CardContent className="p-6 relative z-10">
                      {/* Header with icon and title */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${metric.iconBg} p-2.5 rounded-full shadow-sm`}>
                          <IconComponent className={`h-5 w-5 ${metric.iconColor}`} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white">{metric.title}</h3>
                      </div>

                      {/* Main value */}
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{metric.value}</div>

                      {/* Trend indicator */}
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${metric.trendColor}`}>
                          {metric.trend !== 0 && (
                            <>
                              {metric.trend > 0 ? "+" : ""}
                              {Math.abs(metric.trend).toFixed(0)}
                            </>
                          )}
                          {metric.trend === 0 && "Sin cambios"}
                        </span>
                        <span className="text-sm text-gray-600 ml-1 dark:text-gray-400">{metric.trendText}</span>
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
    </div>
  )
}
