"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { patientService, type Patient, type MedicalRecord } from "@/lib/services/patients"
import {
  Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight,
  User, Heart, Activity, Calendar, Eye, Users, TrendingUp, AlertTriangle
} from "lucide-react"

interface PatientsListProps {
  importedPatients?: any[]
  onError?: (errorMessage: string) => void
  searchQuery?: string
  onPredictAgain?: (patient: Patient, medicalRecord?: any) => void
}

// Estadísticas minimalistas sin colores
function MinimalStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alto Riesgo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.alto || 0}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Riesgo Medio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.medio || 0}</p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bajo Riesgo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.bajo || 4}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 10}</p>
            </div>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Barra de herramientas minimalista
function MinimalToolBar({
  searchTerm,
  onSearchChange,
  onFilterChange,
  onExport,
  onRefresh,
  totalResults
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onFilterChange: (filter: string) => void
  onExport: () => void
  onRefresh: () => void
  totalResults: number
}) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Barra de búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, DNI o historia clínica..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Filtros y acciones */}
          <div className="flex items-center gap-2">
            <Select onValueChange={onFilterChange}>
              <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Filtrar por riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los pacientes</SelectItem>
                <SelectItem value="alto">Alto riesgo</SelectItem>
                <SelectItem value="medio">Riesgo medio</SelectItem>
                <SelectItem value="bajo">Bajo riesgo</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={onExport} className="border-gray-300 dark:border-gray-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-300 dark:border-gray-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Contador de resultados */}
        {totalResults > 0 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <span>{totalResults} paciente{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Tabla completamente minimalista - solo el porcentaje con color
function MinimalPatientsTable({
  patients,
  onViewDetails,
  loading
}: {
  patients: Patient[]
  onViewDetails: (patient: Patient) => void
  loading: boolean
}) {
  // Badge de riesgo visual
  const getRiskBadge = (nivel: string) => {
    // Capitalizar y mapear color
    const normalized = nivel ? nivel.charAt(0).toUpperCase() + nivel.slice(1).toLowerCase() : '';
    const map: any = {
      'Alto': 'bg-red-100 text-red-700 border-red-300',
      'Medio': 'bg-orange-100 text-orange-700 border-orange-300',
      'Bajo': 'bg-green-100 text-green-700 border-green-300',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[normalized] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{normalized}</span>
    )
  }

  // Estado visual
  const getStatus = (patient: any) => {
    if (patient.estado) return patient.estado
    if (patient.activo === false) return 'Inactivo'
    if (patient.riesgo_actual && typeof patient.riesgo_actual === 'string' && patient.riesgo_actual.toLowerCase() === 'alto') return 'Atención'
    if (patient.riesgo_actual && typeof patient.riesgo_actual === 'string' && patient.riesgo_actual.toLowerCase() === 'bajo') return 'Saludable'
    return 'Activo'
  }
  const getStatusIcon = (estado: string) => {
    if (estado === 'Activo') return <span className="text-blue-500">🟦</span>
    if (estado === 'Atención') return <span className="text-orange-500">⚠️</span>
    if (estado === 'Saludable') return <span className="text-green-500">✔️</span>
    if (estado === 'Inactivo') return <span className="text-gray-400">⏸️</span>
    return <span className="text-gray-400">●</span>
  }
  const getStatusColor = (estado: string) => {
    if (estado === 'Activo') return 'text-blue-600'
    if (estado === 'Atención') return 'text-orange-600'
    if (estado === 'Saludable') return 'text-green-600'
    if (estado === 'Inactivo') return 'text-gray-500'
    return 'text-gray-500'
  }
  // Barra de confianza
  const getBarColor = (percentage: number | null) => {
    if (percentage === null) return 'bg-gray-200'
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-400'
    if (percentage >= 40) return 'bg-pink-400'
    return 'bg-red-400'
  }

  const extractRiskLevel = (riskData: any): string => {
    if (!riskData) return "Desconocido"
    if (typeof riskData === 'string') return riskData
    if (typeof riskData === 'object' && riskData.riesgo_nivel) return riskData.riesgo_nivel
    return "Desconocido"
  }

  if (loading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando pacientes...</p>
        </CardContent>
      </Card>
    )
  }

  if (patients.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontraron pacientes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 bg-white shadow-lg rounded-xl">
      <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> Lista de Pacientes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700">Paciente</th>
                <th className="text-left p-4 font-semibold text-gray-700">Edad</th>
                <th className="text-left p-4 font-semibold text-gray-700">IMC</th>
                <th className="text-left p-4 font-semibold text-gray-700">Nivel de Riesgo</th>
                <th className="text-left p-4 font-semibold text-gray-700">Confianza</th>
                <th className="text-left p-4 font-semibold text-gray-700">Último Registro</th>
                <th className="text-left p-4 font-semibold text-gray-700">Estado</th>
                <th className="text-right p-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...patients]
                .sort((a, b) => {
                  // Ordenar por último registro descendente
                  const fechaA = a.ultimo_registro ? new Date(a.ultimo_registro).getTime() : 0;
                  const fechaB = b.ultimo_registro ? new Date(b.ultimo_registro).getTime() : 0;
                  return fechaB - fechaA;
                })
                .map((patient, index) => {
                const riesgoNivel = extractRiskLevel(patient.riesgo_actual)
                const probabilidad = patient.probabilidad !== undefined && patient.probabilidad !== null
                  ? patient.probabilidad
                  : (patient.riesgo_actual && typeof patient.riesgo_actual === 'object' && (patient.riesgo_actual as any).probabilidad !== undefined)
                    ? (patient.riesgo_actual as any).probabilidad
                    : null
                const edad = patient.fecha_nacimiento
                  ? new Date().getFullYear() - new Date(patient.fecha_nacimiento).getFullYear()
                  : "N/A"
                const imc = patient.imc !== undefined && patient.imc !== null ? patient.imc : "N/A"
                const estado = getStatus(patient)
                return (
                  <tr key={patient.id || index} className="border-b border-pink-100 hover:bg-pink-100/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                          <span className="text-base font-bold text-pink-800">
                            {patient.nombre_completo?.split(' ').map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() || 'P'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">
                            {patient.nombre_completo || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {patient.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 font-semibold">{edad} años</td>
                    <td className="p-4 text-gray-700 font-semibold">{imc}</td>
                    <td className="p-4">{getRiskBadge(riesgoNivel)}</td>
                    <td className="p-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-pink-200 rounded-full overflow-hidden">
                          <div className={`h-2 rounded-full ${getBarColor(probabilidad)}`} style={{ width: probabilidad !== null ? `${probabilidad}%` : '0%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-pink-900">{probabilidad !== null ? `${Math.round(probabilidad)}%` : "–"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-medium">
                      {patient.ultimo_registro ? new Date(patient.ultimo_registro).toLocaleDateString('es-ES') : "Sin fecha"}
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 font-semibold ${getStatusColor(estado)}`}>{getStatusIcon(estado)} {estado}</span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(patient)}
                        className="bg-pink-200/60 text-pink-900 font-bold hover:bg-pink-300/80 px-4 py-2 rounded-full"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Paginación minimalista
function MinimalPagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages = []
    const maxVisible = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700 mt-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Página {currentPage} de {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="border-gray-300 dark:border-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            {getVisiblePages().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={currentPage === page
                  ? "bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                  : "border-gray-300 dark:border-gray-600"
                }
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="border-gray-300 dark:border-gray-600"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PatientsList({ importedPatients = [], onError, searchQuery = "", onPredictAgain }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [riskFilter, setRiskFilter] = useState("todos")
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null)
  const [selectedMedicalHistory, setSelectedMedicalHistory] = useState<MedicalRecord[]>([])

  // Sincronizar searchQuery externo
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true)
      try {
        const { patients: pagePatients, total, totalPages: pages } = await patientService.getPatients(
          currentPage,
          20,
          searchTerm || undefined
        )

        setPatients(pagePatients)
        setTotalPatients(total)
        setTotalPages(pages)
      } catch (error) {
        console.error("Error cargando pacientes:", error)
        onError?.("Error al cargar la lista de pacientes")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [currentPage, searchTerm, onError])

  const handleViewDetails = async (patient: Patient) => {
    setSelectedPatient(patient)
    try {
      // Usar la nueva función que obtiene toda la información completa del paciente
      const completeInfo = await patientService.getPatientCompleteInfo(patient.dni)
      if (completeInfo) {
        // Actualizar el paciente seleccionado con la información completa
        setSelectedPatient(completeInfo.patient)
        // Usar el registro médico más reciente
        setSelectedMedicalRecord(completeInfo.medicalRecord)
        // Almacenar el historial médico completo
        setSelectedMedicalHistory(completeInfo.medicalHistory || []);
        console.log(`[handleViewDetails] Información completa cargada para paciente ${patient.dni}:`, {
          patient: completeInfo.patient,
          medicalRecord: completeInfo.medicalRecord,
          historyLength: completeInfo.medicalHistory.length
        })
      } else {
        // Si no se encuentra información completa, usar el método anterior
        console.log(`[handleViewDetails] No se encontró información completa para ${patient.dni}, usando método alternativo`)
        const record = await patientService.getLatestMedicalRecordForPatient(patient.id)
        setSelectedMedicalRecord(record)
        setSelectedMedicalHistory([])
      }
    } catch (error) {
      console.error("Error obteniendo información completa del paciente:", error)
      // Intentar con el método alternativo en caso de error
      try {
        const record = await patientService.getLatestMedicalRecordForPatient(patient.id)
        setSelectedMedicalRecord(record)
        setSelectedMedicalHistory([])
      } catch (fallbackError) {
        console.error("Error en método alternativo:", fallbackError)
        setSelectedMedicalHistory([])
      }
    }
    setIsModalOpen(true)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: string) => {
    setRiskFilter(filter)
    setCurrentPage(1)
  }

  const handleExport = () => {
    console.log("Exportar datos...")
  }

  const handleRefresh = () => {
    setSearchTerm("")
    setRiskFilter("todos")
    setCurrentPage(1)
    window.location.reload()
  }

  const handleSaveContact = async () => {
    console.log("Contacto guardado")
  }

  // Filtrar pacientes por riesgo
  const filteredPatients = riskFilter === "todos"
    ? patients
    : patients.filter(p => {
      const riskLevel = typeof p.riesgo_actual === 'string'
        ? p.riesgo_actual.toLowerCase()
        : (p.riesgo_actual as any)?.riesgo_nivel?.toLowerCase() || 'desconocido'
      return riskLevel === riskFilter.toLowerCase()
    })

  // Estadísticas
  const stats = {
    alto: patients.filter(p => {
      const risk = typeof p.riesgo_actual === 'string' ? p.riesgo_actual : (p.riesgo_actual as any)?.riesgo_nivel
      return risk === 'Alto'
    }).length,
    medio: patients.filter(p => {
      const risk = typeof p.riesgo_actual === 'string' ? p.riesgo_actual : (p.riesgo_actual as any)?.riesgo_nivel
      return risk === 'Medio'
    }).length,
    bajo: patients.filter(p => {
      const risk = typeof p.riesgo_actual === 'string' ? p.riesgo_actual : (p.riesgo_actual as any)?.riesgo_nivel
      return risk === 'Bajo'
    }).length,
    total: patients.length
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas minimalistas */}
      <MinimalStats stats={stats} />

      {/* Barra de herramientas */}
      <MinimalToolBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRefresh={handleRefresh}
        totalResults={filteredPatients.length}
      />

      {/* Tabla de pacientes */}
      <MinimalPatientsTable
        patients={filteredPatients}
        onViewDetails={handleViewDetails}
        loading={loading}
      />

      {/* Paginación */}
      <MinimalPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        medicalRecord={selectedMedicalRecord}
        medicalHistory={selectedMedicalHistory}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
          setSelectedMedicalRecord(null)
          setSelectedMedicalHistory([])
        }}
        onSave={handleSaveContact}
        onPredictAgain={onPredictAgain}
      />
    </div>
  )
}
