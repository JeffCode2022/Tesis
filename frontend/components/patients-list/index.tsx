"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { patientService, type Patient } from "@/lib/services/patients"
import { predictionService } from "@/lib/services/predictions"
import { User, Heart, Activity, Calendar, Eye, Users, ChevronLeft, ChevronRight, Search, Filter, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"

interface PatientsListProps {
  importedPatients?: any[]
  onError?: (errorMessage: string) => void
}

// Estado de carga
function LoadingState() {
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#2563EB]/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/30 dark:bg-gray-900/30 rounded-full blur-2xl"></div>
      </div>
      <div className="relative z-10 min-h-[400px] flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700 p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg mb-6 mx-auto animate-pulse">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <span className="text-xl font-semibold text-gray-800">Cargando pacientes...</span>
          <p className="text-gray-600 mt-2">Obteniendo datos del sistema CardioPredict</p>
          <div className="mt-4 text-sm text-gray-500">
            <div className="animate-pulse">Cargando página actual...</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Estado vacío
function EmptyState() {
  return (
    <div className="text-center py-12 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-gray-700">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pacientes registrados</h3>
      <p className="text-gray-500">Los pacientes aparecerán aquí una vez que sean registrados en el sistema.</p>
    </div>
  )
}

// Encabezado de la lista
function PatientsListHeader({ count, searchTerm, onSearchChange, onReload }: { 
  count: number; 
  searchTerm: string; 
  onSearchChange: (value: string) => void;
  onReload: () => void;
}) {
  return (
    <CardHeader className="bg-[#2563EB]/90 dark:bg-[#2563EB]/80 backdrop-blur-xl rounded-t-3xl text-white shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563EB]/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold drop-shadow">Historial de Pacientes</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder-white/70 rounded-xl w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReload}
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
        </div>
      </div>
      <CardDescription className="text-white/90 text-base drop-shadow">
        Registro completo de evaluaciones realizadas ({count.toLocaleString()} pacientes)
      </CardDescription>
    </CardHeader>
  )
}

// Tarjeta de paciente
function PatientCard({ paciente, onViewDetails, getRiskColor, formatDate }: any) {
  // Función para color del badge según riesgo
  const getBadgeColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/30"
      case "Medio":
        return "border-orange-500 text-orange-500 bg-orange-500/10 hover:bg-orange-500/30"
      case "Bajo":
        return "border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500/30"
      default:
        return "border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/30"
    }
  }
  // Función para color del bloque de probabilidad
  const getProbBlockColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "bg-red-500/90 border-red-500 text-white"
      case "Medio":
        return "bg-orange-500/90 border-orange-500 text-white"
      case "Bajo":
        return "bg-green-500/90 border-green-500 text-white"
      default:
        return "bg-blue-500/90 border-blue-500 text-white"
    }
  }
  const riesgoNivel = paciente.riesgo_actual?.riesgo_nivel
  return (
    <Card
      className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden relative px-4 py-3"
      onClick={() => onViewDetails(paciente)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-900/20 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between gap-6 flex-row w-full">
        {/* Info principal */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 shadow-lg border-2 border-[#2563EB]/30">
              <AvatarFallback className="bg-[#2563EB]/10 text-[#2563EB] font-bold text-lg">
                {paciente.nombre_completo ? paciente.nombre_completo.split(" ").map((n: string) => n[0]).join("") : <User className="h-7 w-7 text-[#2563EB]" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="font-semibold tracking-wide text-base text-gray-900 dark:text-white truncate group-hover:text-[#2563EB] transition-colors">
              {paciente.nombre_completo}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-gray-300 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{paciente.edad} años</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>IMC: {paciente.imc !== undefined && paciente.imc !== null ? paciente.imc : "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(paciente.ultimo_registro)}</span>
            </div>
          </div>
        </div>
        {/* Probabilidad, riesgo y botón */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className={`text-center rounded-xl px-5 py-2 text-2xl font-bold shadow-md flex flex-col items-center min-w-[90px] ${getProbBlockColor(riesgoNivel)}`}>
            <div className="text-white">
              {paciente.riesgo_actual?.probabilidad !== undefined && paciente.riesgo_actual?.probabilidad !== null ? `${Math.round(paciente.riesgo_actual.probabilidad)}%` : "N/A"}
            </div>
            <div className="text-xs text-white/80 font-medium">Probabilidad</div>
          </div>
          <Badge
            variant="outline"
            className={`px-4 py-2 font-semibold border-2 transition-all duration-300 rounded-xl ${getBadgeColor(riesgoNivel)}`}
          >
            {paciente.riesgo_actual?.riesgo_nivel || "Desconocido"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/30 rounded-xl px-4 py-2 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(paciente)
            }}
          >
            <Eye className="w-4 h-4 mr-2 text-blue-500 group-hover:text-white transition-colors" />
            Ver Detalles
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Nuevo estado de carga para el contenido interno
function ContentLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="w-12 h-12 bg-[#2563EB]/20 rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
          <Heart className="w-6 h-6 text-[#2563EB]" />
        </div>
        <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Actualizando...</span>
        <p className="text-sm">Cargando nuevos datos de pacientes.</p>
      </div>
    </div>
  );
}

// Componente de paginación
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages = []
  const maxVisiblePages = 5
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>
      
      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            className="border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
          >
            1
          </Button>
          {startPage > 2 && <span className="text-gray-500">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={page === currentPage 
            ? "bg-[#2563EB] text-white" 
            : "border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
          }
        >
          {page}
        </Button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10"
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function PatientsList({ importedPatients = [], onError }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Nuevo estado para la carga inicial
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [patientsPerPage] = useState(50)

  // Cargar pacientes de la página actual
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true)
      console.log(`[PatientsList] Cargando página ${currentPage} con búsqueda: "${searchTerm}"`)
      
      try {
        const { patients: pagePatients, total, totalPages: pages } = await patientService.getPatients(
          currentPage, 
          patientsPerPage, 
          searchTerm || undefined
        )
        
        console.log(`[PatientsList] Página ${currentPage}: ${pagePatients.length} pacientes de ${total} totales`)
        
        setPatients(pagePatients)
        setTotalPatients(total)
        setTotalPages(pages)
        
      } catch (error) {
        console.error('[PatientsList] Error cargando pacientes:', error)
        setPatients([])
        onError?.(error instanceof Error ? error.message : "Error al cargar los pacientes")
      } finally {
        setLoading(false)
        if (isInitialLoad) {
          setIsInitialLoad(false)
        }
      }
    }
    fetchPatients()
  }, [currentPage, searchTerm, patientsPerPage, onError, isInitialLoad])

  const allPatients = [...patients, ...(importedPatients || []).slice(0, 5)]

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Resetear a la primera página cuando se busca
  }

  const handleReload = () => {
    setCurrentPage(1)
    setSearchTerm("")
  }

  const getRiskColor = (riesgo: string | null) => {
    switch (riesgo) {
      case "Alto":
        return "border-red-500 text-red-700 bg-red-50/80 backdrop-blur-sm"
      case "Medio":
        return "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/10 backdrop-blur-sm"
      case "Bajo":
        return "border-[#2563EB]/60 text-[#2563EB]/80 bg-[#2563EB]/5 backdrop-blur-sm"
      default:
        return "border-gray-500 text-gray-700 bg-gray-50/80 backdrop-blur-sm"
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    } catch {
      return "N/A"
    }
  }

  if (isInitialLoad) return <LoadingState />

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#2563EB]/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/20 dark:bg-gray-900/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gray-200/30 rounded-full blur-xl"></div>
      </div>
      
      <div className="relative z-10 flex justify-center min-h-screen">
        <div className="w-full max-w-7xl px-4 py-6">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-2xl border border-white/30 dark:border-gray-700 rounded-3xl overflow-hidden min-h-[calc(100vh-3rem)] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            <PatientsListHeader 
              count={totalPatients} 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onReload={handleReload}
            />
            <CardContent className="relative z-10 p-8 flex-1 overflow-y-auto">
              {loading ? (
                <ContentLoadingState />
              ) : (
                <div className="space-y-4">
                  {allPatients.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      <div className="grid gap-4">
                        {allPatients.map((paciente, index) => (
                          <PatientCard
                            key={`${paciente.id || index}-${currentPage}-${searchTerm}`}
                            paciente={paciente}
                            onViewDetails={handleViewDetails}
                            getRiskColor={getRiskColor}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                      
                      {totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      )}
                      
                      <div className="text-center text-sm text-gray-500 mt-4">
                        {searchTerm ? (
                          `Mostrando página ${currentPage} de ${totalPages} - ${totalPatients.toLocaleString()} pacientes encontrados`
                        ) : (
                          `Mostrando página ${currentPage} de ${totalPages} - ${totalPatients.toLocaleString()} pacientes totales`
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
        }}
      />
    </div>
  )
}
