"use client"

import { Users, Activity, TrendingUp, Shield, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Sparklines, SparklinesLine } from 'react-sparklines'

interface MetricsData {
  total_patients: number
  total_predictions: number
  high_risk_count: number
  monthly_growth: number
  previous_month_patients?: number
  previous_month_predictions?: number
  previous_month_high_risk?: number
  previous_month_growth?: number
  patients_history?: number[]
  high_risk_history?: number[]
  accuracy_history?: number[]
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
      title: "PACIENTES HOY",
      value: data.total_patients.toLocaleString(),
      icon: Users,
      iconColor: "text-white",
      iconBg: "bg-[#4ECDC4]",
      trendText: "vs ayer",
    },
    {
      title: "RIESGO ALTO",
      value: data.high_risk_count.toString(),
      icon: Activity,
      iconColor: "text-white",
      iconBg: "bg-red-500",
      trendText: "nuevos casos",
    },
    {
      title: "PRECISIÓN IA",
      value: `${data.monthly_growth}%`,
      icon: BarChart3,
      iconColor: "text-white",
      iconBg: "bg-green-500",
      trendText: "esta semana",
    },
  ]

  return (
    <TooltipProvider>
      <div className={cn("relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/0 dark:border-gray-900/0 p-8 flex flex-col items-start group cursor-pointer hover:scale-[1.03] hover:-translate-y-1 mb-4"
            >
              <CardContent className="p-0 w-full">
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`${metric.iconBg} p-4 rounded-full shadow-sm flex items-center justify-center`}>
                      <IconComponent className={`h-8 w-8 ${metric.iconColor}`} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-wide uppercase ml-1">{metric.title}</h3>
                  </div>
                  <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">{metric.value}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{metric.trendText}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
