"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PatientDetailsModal } from "@/components/patient-details-modal"
import { patientService, type Patient, type MedicalRecord } from "@/lib/services/patients"
import { predictionService } from "@/lib/services/predictions"
import {
  User, Heart, Activity, Calendar, Eye, ChevronLeft, ChevronRight, 
  Search, Filter, RefreshCw, Stethoscope, 
  HeartPulse, AlertTriangle, ShieldCheck, Users
} from "lucide-react";
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
            <HeartPulse className="w-8 h-8 text-white fill-white" />
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

// 1. Cabecera mejorada con glassmorphism y gráfico de distribución de riesgo
function PatientsListHeader({ count, searchTerm, onSearchChange, onReload, riskStats }: { 
  count: number; 
  searchTerm: string; 
  onSearchChange: (value: string) => void;
  onReload: () => void;
  riskStats?: { Bajo: number; Medio: number; Alto: number };
}) {
  return (
    <CardHeader className="bg-[#2563EB]/90 dark:bg-gradient-to-br dark:from-[#2563EB]/80 dark:to-gray-900 backdrop-blur-xl rounded-t-3xl text-white shadow-lg p-6 relative overflow-hidden">
      {/* Fondo glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-[#2563EB]/10 dark:from-gray-900/30 dark:to-[#2563EB]/10 pointer-events-none rounded-t-3xl" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563EB]/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold drop-shadow">Historial de Pacientes</CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/20 dark:bg-gray-900/30 backdrop-blur-sm border-white/30 text-white placeholder-white/70 rounded-xl w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 backdrop-blur-sm rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReload}
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 backdrop-blur-sm rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
        </div>
      </div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between mt-2">
        <CardDescription className="text-white/90 text-base drop-shadow">
          Registro completo de evaluaciones realizadas ({count.toLocaleString()} pacientes)
        </CardDescription>
        {/* Gráfico de barras de distribución de riesgo */}
        {riskStats && (
          <div className="flex items-end gap-2 mt-2 md:mt-0">
            {Object.entries(riskStats).map(([nivel, valor]) => (
              <div key={nivel} className="flex flex-col items-center">
                <div className={`w-4 rounded-t-lg ${nivel === 'Alto' ? 'bg-red-500' : nivel === 'Medio' ? 'bg-orange-400' : 'bg-green-500'}`} style={{ height: `${20 + valor * 2}px` }} />
                <span className="text-xs mt-1" style={{ color: nivel === 'Alto' ? '#ef4444' : nivel === 'Medio' ? '#f59e42' : '#22c55e' }}>{nivel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardHeader>
  )
}

// 2. Mejorar visual de las tarjetas de paciente (PatientCard)
// - Más separación, glassmorphism, badges y botón destacado
function PatientCard({ paciente, onViewDetails, getRiskColor, formatDate }: any) {
  // Helper para nivel de riesgo
  const extractRiskLevel = (riskData: any): string => {
    if (!riskData) return "Desconocido";
    if (typeof riskData === 'string') return riskData;
    if (typeof riskData === 'object' && riskData.riesgo_nivel) return riskData.riesgo_nivel;
    return "Desconocido";
  };
  const riesgoNivel = extractRiskLevel(paciente.riesgo_actual);
  const getRiskColorBlock = (nivel: string) => {
    switch (nivel) {
      case "Alto": return "bg-red-600 text-white";
      case "Medio": return "bg-yellow-400 text-gray-900";
      case "Bajo": return "bg-green-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };
  const probabilidad = paciente.probabilidad !== undefined && paciente.probabilidad !== null
    ? paciente.probabilidad
    : (paciente.riesgo_actual && typeof paciente.riesgo_actual === 'object' && paciente.riesgo_actual.probabilidad !== undefined)
      ? paciente.riesgo_actual.probabilidad
      : null;
  const imc = paciente.imc !== undefined && paciente.imc !== null ? paciente.imc : "N/A";
  const edad = paciente.fecha_nacimiento ? new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear() : "N/A";
  // Badge de riesgo con color sólido según nivel
  const getRiskBadgeColor = (nivel: string) => {
    switch (nivel) {
      case "Alto": return "bg-red-600 text-white";
      case "Medio": return "bg-yellow-400 text-gray-900";
      case "Bajo": return "bg-green-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };
  return (
    <div className="w-full flex items-center justify-between gap-6 px-6 py-5 rounded-2xl shadow-xl bg-white/70 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 backdrop-blur-xl border border-white/20 dark:border-gray-700 mb-4 relative overflow-hidden group">
      {/* Fondo glassmorphism cardiológico */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#e0e7ff]/40 via-[#f1f5f9]/60 to-[#f0fdfa]/40 pointer-events-none rounded-2xl" />
      {/* Avatar e info principal */}
      <div className="flex items-center gap-5 min-w-0 flex-1 z-10">
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2563EB]/30 to-[#22d3ee]/30 flex items-center justify-center border-4 border-[#2563EB]/30 shadow-lg">
            <span className="text-2xl font-bold text-[#2563EB]">{paciente.nombre_completo ? paciente.nombre_completo.split(" ").map((n: string) => n[0]).join("") : <User className="h-7 w-7 text-[#2563EB]" />}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="font-bold tracking-wide text-lg text-gray-900 dark:text-white truncate group-hover:text-[#2563EB] transition-colors">{paciente.nombre_completo}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 flex-wrap">
            <div className="flex items-center gap-1"><User className="w-4 h-4 text-gray-500 dark:text-gray-400" /><span>{edad} años</span></div>
            <div className="flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500" /><span>IMC: {imc}</span></div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Calendar className="w-3 h-3" /><span>{formatDate(paciente.ultimo_registro)}</span></div>
        </div>
      </div>
      {/* Probabilidad y riesgo */}
      <div className="flex items-center gap-6 flex-shrink-0 z-10">
        <div className={`flex flex-col items-center justify-center rounded-2xl px-7 py-3 min-w-[110px] ${getRiskColorBlock(riesgoNivel)} shadow-lg`}>
          <div className="text-3xl font-extrabold drop-shadow flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-white/80 mr-1" />
            {probabilidad !== null ? `${Math.round(probabilidad)}%` : "N/A"}
          </div>
          <div className="text-xs text-white/80 font-medium mt-1">Probabilidad</div>
        </div>
        <div className={`px-5 py-2 rounded-xl text-base font-bold shadow-md ${getRiskBadgeColor(riesgoNivel)}`}>{riesgoNivel || "Desconocido"}</div>
        <button
          onClick={() => onViewDetails(paciente)}
          className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#2563EB] shadow-md transition-all duration-200 focus:ring-2 focus:ring-[#2563EB]/40 focus:outline-none"
        >
          <Eye className="w-5 h-5" />
          Ver Detalles
        </button>
      </div>
    </div>
  );
}

// Nuevo estado de carga para el contenido interno
function ContentLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="w-12 h-12 bg-[#2563EB]/20 rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
          <HeartPulse className="w-6 h-6 text-[#2563EB]" />
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
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null)

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

  const handleViewDetails = async (patient: Patient) => {
    // Usar directamente el objeto del listado para el modal
    setSelectedPatient(patient)
    // Si quieres, puedes seguir trayendo el último registro médico
    const record = await patientService.getLatestMedicalRecordForPatient(patient.id)
    setSelectedMedicalRecord(record)
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

  // Función para guardar los datos de contacto editados y medicamentos actuales
  const handleSaveContact = async (data: any) => {
    if (!selectedPatient) return;
    try {
      // Actualizar datos de contacto del paciente
      const updated = await patientService.updatePatient(selectedPatient.id, {
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
      });
      setSelectedPatient((prev) => prev ? { ...prev, ...updated } : prev);
      setPatients((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));

      // Actualizar medicamentos actuales en el registro médico más reciente
      if (selectedMedicalRecord && typeof data.medicamentos_actuales === 'string') {
        // Convertir a array si es necesario
        const medicamentosArray = data.medicamentos_actuales
          .split(',')
          .map((m: string) => m.trim())
          .filter((m: string) => m.length > 0);
        const updatedRecord = await patientService.updateMedicalRecord(selectedMedicalRecord.id, {
          medicamentos_actuales: medicamentosArray
        });
        setSelectedMedicalRecord((prev) => prev ? { ...prev, ...updatedRecord } : prev);
      }
    } catch (error) {
      console.error('Error al guardar información de contacto o medicamentos:', error);
      throw error;
    }
  };

  // Calcular conteo de pacientes por nivel de riesgo (corrección de tipado)
  const riskCounts = patients.reduce<{
    alto: number;
    medio: number;
    bajo: number;
    otros: number;
  }>(
    (acc, p) => {
      const nivel = (p.riesgo_actual && typeof p.riesgo_actual === 'object' && (p.riesgo_actual as any).riesgo_nivel)
        ? (p.riesgo_actual as any).riesgo_nivel.toLowerCase()
        : 'desconocido';
      if (nivel === 'alto') acc.alto++;
      else if (nivel === 'medio') acc.medio++;
      else if (nivel === 'bajo') acc.bajo++;
      else acc.otros++;
      return acc;
    },
    { alto: 0, medio: 0, bajo: 0, otros: 0 }
  );

  // Componente de indicadores flotantes glassmorphism fuera del Card
  const RiskIndicators = () => (
    <div className="flex flex-wrap gap-6 mb-10 w-full px-2">
      <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/0 dark:border-gray-900/0 p-8 flex flex-col items-start group cursor-pointer hover:scale-[1.03] hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-500 p-4 rounded-full shadow-sm flex items-center justify-center">
            <HeartPulse className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-wide uppercase ml-1">RIESGO ALTO</h3>
        </div>
        <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">{riskCounts.alto}</div>
        <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">Pacientes</div>
      </div>
      <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/0 dark:border-gray-900/0 p-8 flex flex-col items-start group cursor-pointer hover:scale-[1.03] hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-400 p-4 rounded-full shadow-sm flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-wide uppercase ml-1">RIESGO MEDIO</h3>
        </div>
        <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">{riskCounts.medio}</div>
        <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">Pacientes</div>
      </div>
      <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/0 dark:border-gray-900/0 p-8 flex flex-col items-start group cursor-pointer hover:scale-[1.03] hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-500 p-4 rounded-full shadow-sm flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-wide uppercase ml-1">RIESGO BAJO</h3>
        </div>
        <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">{riskCounts.bajo}</div>
        <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">Pacientes</div>
      </div>
      <div className="flex-1 min-w-[220px] bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/0 dark:border-gray-900/0 p-8 flex flex-col items-start group cursor-pointer hover:scale-[1.03] hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-4 rounded-full shadow-sm flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 tracking-wide uppercase ml-1">TOTAL PACIENTES</h3>
        </div>
        <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 drop-shadow-sm">{patients.length}</div>
        <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">Pacientes</div>
      </div>
    </div>
  );

  if (isInitialLoad) return <LoadingState />

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#2563EB]/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-white/20 dark:bg-gray-900/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gray-200/30 rounded-full blur-xl"></div>
      </div>
      {/* Indicadores glassmorphism fuera del Card */}
      <div className="relative z-20 max-w-7xl mx-auto pt-8">
        <RiskIndicators />
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
        medicalRecord={selectedMedicalRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
          setSelectedMedicalRecord(null)
        }}
        onSave={handleSaveContact}
      />
    </div>
  )
}


