"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Activity, 
  TrendingUp, 
  BarChart3,
  Filter,
  Search,
  Eye,
  Printer,
  Share2,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

interface Report {
  id: string
  title: string
  type: string
  status: 'completed' | 'processing' | 'failed'
  createdAt: string
  size: string
  description: string
}

export function ReportsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Datos de ejemplo para reportes
  const reports: Report[] = [
    {
      id: "1",
      title: "Reporte Mensual de Pacientes",
      type: "Pacientes",
      status: "completed",
      createdAt: "2024-01-15",
      size: "2.3 MB",
      description: "Análisis completo de pacientes registrados en enero 2024"
    },
    {
      id: "2",
      title: "Análisis de Riesgo Cardiovascular",
      type: "Predicciones",
      status: "completed",
      createdAt: "2024-01-14",
      size: "1.8 MB",
      description: "Evaluación de factores de riesgo y predicciones del modelo"
    },
    {
      id: "3",
      title: "Reporte de Precisión del Modelo",
      type: "Analíticas",
      status: "processing",
      createdAt: "2024-01-15",
      size: "Generando...",
      description: "Métricas de precisión y rendimiento del modelo ML"
    },
    {
      id: "4",
      title: "Exportación de Datos Médicos",
      type: "Datos",
      status: "failed",
      createdAt: "2024-01-13",
      size: "Error",
      description: "Exportación de registros médicos para análisis externo"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'processing': return 'bg-yellow-500 text-white'
      case 'failed': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Pacientes': return <Users className="w-5 h-5" />
      case 'Predicciones': return <Activity className="w-5 h-5" />
      case 'Analíticas': return <BarChart3 className="w-5 h-5" />
      case 'Datos': return <FileText className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || report.type === filterType
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#2563EB]/15 dark:bg-[#2563EB]/25 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/20 dark:bg-gray-900/30 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gray-200/30 dark:bg-gray-700/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-[150px] h-[150px] bg-[#22d3ee]/20 dark:bg-[#22d3ee]/30 rounded-full blur-lg"></div>
      </div>

      <div className="relative z-10 flex justify-center min-h-screen">
        <div className="w-full max-w-7xl px-4 py-6">
          <Card className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 rounded-3xl overflow-hidden min-h-[calc(100vh-3rem)] flex flex-col relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-800/20 to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <CardHeader className="bg-gradient-to-br from-[#2563EB]/90 via-[#1E40AF]/80 to-[#2563EB]/90 dark:from-[#2563EB]/80 dark:via-gray-900/90 dark:to-[#2563EB]/80 backdrop-blur-xl rounded-t-3xl text-white shadow-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-[#2563EB]/10 to-white/10 dark:from-gray-900/30 dark:via-[#2563EB]/10 dark:to-gray-900/30 pointer-events-none rounded-t-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 dark:bg-gray-900/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold drop-shadow">Centro de Reportes</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-sm border-white/30 dark:border-gray-700/50 text-white hover:bg-white/30 dark:hover:bg-gray-900/60 transition-all duration-200">
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </Button>
                </div>
              </div>
              <CardDescription className="text-white/90 text-base drop-shadow mt-2">
                Gestión y generación de reportes médicos y analíticos
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 p-8 flex-1 overflow-y-auto">
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-full shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completados</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-full shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">En Proceso</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-full shadow-lg">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Fallidos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">1</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">28</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros y búsqueda */}
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar reportes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-gray-700/50"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-gray-700/50">
                      <SelectValue placeholder="Tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="Pacientes">Pacientes</SelectItem>
                      <SelectItem value="Predicciones">Predicciones</SelectItem>
                      <SelectItem value="Analíticas">Analíticas</SelectItem>
                      <SelectItem value="Datos">Datos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/30 dark:border-gray-700/50">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="processing">En proceso</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de reportes */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#e0e7ff]/40 via-[#f1f5f9]/60 to-[#f0fdfa]/40 dark:from-[#1e293b]/40 dark:via-[#334155]/60 dark:to-[#0f172a]/40 pointer-events-none rounded-2xl" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB]/30 to-[#22d3ee]/30 dark:from-[#2563EB]/40 dark:to-[#22d3ee]/40 rounded-full flex items-center justify-center border-2 border-[#2563EB]/30 dark:border-[#2563EB]/40 shadow-lg">
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#22d3ee] transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.createdAt).toLocaleDateString('es-ES')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{report.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(report.status)} backdrop-blur-sm`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {report.status === 'completed' ? 'Completado' : 
                             report.status === 'processing' ? 'En Proceso' : 'Fallido'}
                          </span>
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-[#2563EB]/30 dark:border-[#22d3ee]/30 text-[#2563EB] dark:text-[#22d3ee] hover:bg-[#2563EB]/10 dark:hover:bg-[#22d3ee]/10 backdrop-blur-sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#2563EB]/30 dark:border-[#22d3ee]/30 text-[#2563EB] dark:text-[#22d3ee] hover:bg-[#2563EB]/10 dark:hover:bg-[#22d3ee]/10 backdrop-blur-sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#2563EB]/30 dark:border-[#22d3ee]/30 text-[#2563EB] dark:text-[#22d3ee] hover:bg-[#2563EB]/10 dark:hover:bg-[#22d3ee]/10 backdrop-blur-sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-12 bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-gray-800/10 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No se encontraron reportes</h3>
                    <p className="text-gray-500 dark:text-gray-400">Intenta ajustar los filtros de búsqueda.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 