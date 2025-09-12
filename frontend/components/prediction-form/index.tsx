"use client"

import { useState, useEffect } from "react"
import { useMemo } from "react"
import { User, Heart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { predictionService } from "@/lib/services/predictions"
import { patientService } from "@/lib/services/patients"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PredictionResultModal } from "@/components/prediction-results/PredictionResultModal"
import type { Patient } from "@/lib/services/patients"

interface FormData {
  nombre: string
  apellidos: string
  dni: string
  fecha_nacimiento: string
  sexo: string
  peso: string
  altura: string
  presion_sistolica: string
  presion_diastolica: string
  frecuencia_cardiaca: string
  colesterol: string
  colesterol_hdl: string
  colesterol_ldl: string
  trigliceridos: string
  glucosa: string
  hemoglobina_glicosilada: string
  cigarrillos_dia: string
  anos_tabaquismo: string
  actividad_fisica: string
  antecedentes_cardiacos: string
  diabetes: string
  hipertension: string
  numero_historia: string
}

interface PredictionFormProps {
  formData: FormData
  onFormChange: (field: string, value: string) => void
  onPredict: (result: any) => void
}

export function PredictionForm({ formData, onFormChange, onPredict }: PredictionFormProps) {
  const [localFormData, setLocalFormData] = useState(formData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [searchingPatient, setSearchingPatient] = useState(false)
  const [showEvaluationAnimation, setShowEvaluationAnimation] = useState(false)

  // Sincronizar con props cuando cambien
  useEffect(() => {
    setLocalFormData(formData)
  }, [formData])

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...localFormData, [field]: value }
    setLocalFormData(newData)
    onFormChange(field, value)
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Protección contra doble envío
    if (loading) {
      console.log('[PredictionForm] Formulario ya está procesando, ignorando envío adicional')
      return
    }
    
    setLoading(true)
    setError("")
    
    console.log('[PredictionForm] Iniciando procesamiento de predicción...')
    
    try {
      const camposRequeridos = {
        presion_sistolica: formData.presion_sistolica,
        presion_diastolica: formData.presion_diastolica,
        cigarrillos_dia: formData.cigarrillos_dia,
        anos_tabaquismo: formData.anos_tabaquismo,
        actividad_fisica: formData.actividad_fisica,
        antecedentes_cardiacos: formData.antecedentes_cardiacos,
        colesterol: formData.colesterol,
        glucosa: formData.glucosa,
        diabetes: formData.diabetes,
        hipertension: formData.hipertension
      };

      // Verificar que todos los campos requeridos tengan valores
      const camposFaltantes = Object.entries(camposRequeridos)
        .filter(([campo, valor]) => !valor || valor.toString().trim() === '')
        .map(([campo]) => campo);

      if (camposFaltantes.length > 0) {
        throw new Error(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
      }

      // Validar fecha de nacimiento
      if (!formData.fecha_nacimiento || formData.fecha_nacimiento.trim() === '') {
        throw new Error('La fecha de nacimiento es obligatoria');
      }

      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 120) {
        throw new Error('La fecha de nacimiento debe corresponder a una edad entre 0 y 120 años');
      }

      if (birthDate > today) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }

      const predictionData = {
        nombre: localFormData.nombre,
        apellidos: localFormData.apellidos,
        dni: localFormData.dni,
        fecha_nacimiento: localFormData.fecha_nacimiento,
        sexo: localFormData.sexo,
        peso: parseFloat(localFormData.peso),
        altura: parseFloat(localFormData.altura),
        presionSistolica: parseInt(localFormData.presion_sistolica),
        presionDiastolica: parseInt(localFormData.presion_diastolica),
        colesterol: parseInt(localFormData.colesterol),
        colesterol_hdl: localFormData.colesterol_hdl ? parseInt(localFormData.colesterol_hdl) : 0,
        colesterol_ldl: localFormData.colesterol_ldl ? parseInt(localFormData.colesterol_ldl) : 0,
        trigliceridos: localFormData.trigliceridos ? parseInt(localFormData.trigliceridos) : 0,
        glucosa: parseInt(localFormData.glucosa),
        hemoglobina_glicosilada: localFormData.hemoglobina_glicosilada ? parseFloat(localFormData.hemoglobina_glicosilada) : 0,
        cigarrillosDia: parseInt(localFormData.cigarrillos_dia),
        anosTabaquismo: parseInt(localFormData.anos_tabaquismo),
        actividadFisica: localFormData.actividad_fisica,
        antecedentesCardiacos: localFormData.antecedentes_cardiacos,
        diabetes: localFormData.diabetes || 'no',
        hipertension: localFormData.hipertension || 'no',
        numero_historia: localFormData.numero_historia,
      }

      // Validar que los valores numéricos sean válidos
      Object.entries(predictionData).forEach(([key, value]) => {
        if (typeof value === 'number' && isNaN(value)) {
          throw new Error(`El campo ${key} tiene un valor numérico inválido`);
        }
      });
      console.log('[PredictionForm] Datos enviados a predict:', predictionData)
      const result = await predictionService.predict(predictionData)
      
      // Mostrar animación de evaluación exitosa
      setShowEvaluationAnimation(true)
      
      // Después de 3 segundos, mostrar modal
      setTimeout(() => {
        setPredictionResult({ ...result, ...localFormData })
        setShowModal(true)
        setShowEvaluationAnimation(false)
        onPredict(result)
        
        // NO limpiar el formulario aquí para evitar que se pierdan los datos del modal
        // El formulario se limpiará cuando el usuario cierre el modal o inicie nueva predicción
      }, 3000)
    } catch (error: any) {
      setError(error.message || "Error al realizar la predicción. Por favor, intente nuevamente.");
      setShowEvaluationAnimation(false) // Asegurar que se oculte la animación en caso de error
    } finally {
      setLoading(false)
      console.log('[PredictionForm] Procesamiento finalizado')
    }
  }

  const calculateProfileCompleteness = () => {
    const camposOpcionales = [
      'frecuencia_cardiaca',
      'colesterol_hdl', 
      'colesterol_ldl',
      'trigliceridos',
      'hemoglobina_glicosilada'
    ];
    
    const camposRequeridos = [
      'nombre', 'apellidos', 'dni', 'fecha_nacimiento', 'sexo', 'numero_historia',
      'peso', 'altura', 'presion_sistolica', 'presion_diastolica', 
      'colesterol', 'glucosa', 'cigarrillos_dia', 'anos_tabaquismo',
      'actividad_fisica', 'antecedentes_cardiacos', 'diabetes', 'hipertension'
    ];
    
    const requeridosCompletos = camposRequeridos.filter(campo => 
      localFormData[campo as keyof FormData] && 
      localFormData[campo as keyof FormData].toString().trim() !== ''
    ).length;
    
    const opcionalesCompletos = camposOpcionales.filter(campo => 
      localFormData[campo as keyof FormData] && 
      localFormData[campo as keyof FormData].toString().trim() !== ''
    ).length;
    
    const totalCampos = camposRequeridos.length + camposOpcionales.length;
    const camposCompletos = requeridosCompletos + opcionalesCompletos;
    
    return {
      porcentaje: Math.round((camposCompletos / totalCampos) * 100),
      requeridos: requeridosCompletos,
      totalRequeridos: camposRequeridos.length,
      opcionales: opcionalesCompletos,
      totalOpcionales: camposOpcionales.length
    };
  };

  const profileCompleteness = calculateProfileCompleteness();

  const clearForm = () => {
    const emptyForm = {
      nombre: '',
      apellidos: '',
      dni: '',
      fecha_nacimiento: '',
      sexo: '',
      peso: '',
      altura: '',
      presion_sistolica: '',
      presion_diastolica: '',
      frecuencia_cardiaca: '',
      colesterol: '',
      colesterol_hdl: '',
      colesterol_ldl: '',
      trigliceridos: '',
      glucosa: '',
      hemoglobina_glicosilada: '',
      cigarrillos_dia: '',
      anos_tabaquismo: '',
      actividad_fisica: '',
      antecedentes_cardiacos: '',
      diabetes: '',
      hipertension: '',
      numero_historia: ''
    }
    setLocalFormData(emptyForm)
    // Limpiar el estado del componente padre también
    Object.keys(emptyForm).forEach(key => {
      onFormChange(key, '')
    })
    setError('')
  }

  const isFormValid = () => {
    const camposRequeridos = {
      // Datos personales básicos
      nombre: localFormData.nombre,
      apellidos: localFormData.apellidos,
      dni: localFormData.dni,
      fecha_nacimiento: localFormData.fecha_nacimiento,
      sexo: localFormData.sexo,
      numero_historia: localFormData.numero_historia,
      
      // Medidas físicas
      peso: localFormData.peso,
      altura: localFormData.altura,
      
      // Signos vitales y mediciones
      presion_sistolica: localFormData.presion_sistolica,
      presion_diastolica: localFormData.presion_diastolica,
      colesterol: localFormData.colesterol,
      glucosa: localFormData.glucosa,
      
      // Factores de riesgo
      cigarrillos_dia: localFormData.cigarrillos_dia,
      anos_tabaquismo: localFormData.anos_tabaquismo,
      actividad_fisica: localFormData.actividad_fisica,
      antecedentes_cardiacos: localFormData.antecedentes_cardiacos,
      diabetes: localFormData.diabetes,
      hipertension: localFormData.hipertension
    };

    // Verificar que todos los campos requeridos tengan valores
    return Object.entries(camposRequeridos).every(([_, valor]) => {
      if (typeof valor === 'string') {
        return valor.trim() !== '';
      }
      return valor !== undefined && valor !== null;
    });
  };

  const handleDniBlur = async () => {
    if (localFormData.dni && localFormData.dni.length === 8) {
      setSearchingPatient(true);
      setError("");
      try {
        const result = await patientService.getPatientByDniV2(formData.dni);
        if (result.error) {
          setError(result.error);
          // Limpiar todos los campos
          onFormChange("nombre", "");
          onFormChange("apellidos", "");
          onFormChange("fecha_nacimiento", "");
          onFormChange("sexo", "");
          onFormChange("numero_historia", "");
          onFormChange("peso", "");
          onFormChange("altura", "");
          return;
        }

        // Si no hay error, significa que el paciente existe y result contiene sus datos
        setError("");
        const patient = result;
        // Extraer nombre y apellidos del nombre_completo si es necesario
        let nombre = patient.nombre;
        let apellidos = patient.apellidos;
        if (!nombre && patient.nombre_completo) {
          const partes = patient.nombre_completo.split(' ');
          nombre = partes[0] || '';
          apellidos = partes.slice(1).join(' ');
        }
        onFormChange("nombre", nombre);
        onFormChange("apellidos", apellidos);
        onFormChange("fecha_nacimiento", patient.fecha_nacimiento || "");
        onFormChange("sexo", patient.sexo || "");
        onFormChange("numero_historia", patient.numero_historia || "");
        onFormChange("peso", patient.peso ? String(patient.peso) : "");
        onFormChange("altura", patient.altura ? String(patient.altura) : "");
      } catch (error) {
        setError("Error al buscar paciente por DNI. Intente nuevamente.");
        onFormChange("nombre", "");
        onFormChange("apellidos", "");
        onFormChange("fecha_nacimiento", "");
        onFormChange("sexo", "");
        onFormChange("numero_historia", "");
        onFormChange("peso", "");
        onFormChange("altura", "");
      } finally {
        setSearchingPatient(false);
      }
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    onFormChange("nombre", patient.nombre || "")
    onFormChange("apellidos", patient.apellidos || "")
    onFormChange("dni", patient.dni || "")
    onFormChange("fecha_nacimiento", patient.fecha_nacimiento || "")
    onFormChange("sexo", patient.sexo || "")
    onFormChange("peso", patient.peso ? String(patient.peso) : "")
    onFormChange("altura", patient.altura ? String(patient.altura) : "")
    
    // Limpiar otros campos
    onFormChange("presion_sistolica", "")
    onFormChange("presion_diastolica", "")
    onFormChange("frecuencia_cardiaca", "")
    onFormChange("colesterol", "")
    onFormChange("glucosa", "")
    onFormChange("cigarrillos_dia", "")
    onFormChange("anos_tabaquismo", "")
    onFormChange("actividad_fisica", "")
    onFormChange("antecedentes_cardiacos", "")
    onFormChange("diabetes", "")
    onFormChange("hipertension", "")
  }

  return (
    <TooltipProvider>
      {/* Animación de Evaluación Exitosa */}
      {showEvaluationAnimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
            <div className="text-center">
              {/* Corazón Latiente */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Heart className="w-20 h-20 text-red-500 animate-heartbeat" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
              
              {/* Spinner */}
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
              </div>
              
              {/* Mensaje */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Evaluación Exitosa! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Analizando datos cardiovasculares...
              </p>
              
              {/* Barra de progreso animada */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full animate-progress"></div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Generando informe de riesgo cardiovascular...
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 dark:bg-gradient-to-br w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Formulario de Predicción</CardTitle>
          <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Completa los datos del paciente para predecir el riesgo cardiovascular.
            <p className="text-sm mt-2">
              Los campos marcados con <span className="text-red-500">*</span> son necesarios para la predicción del modelo.
              <br />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                💡 Para un perfil médico completo, recomendamos llenar también los campos opcionales (HDL, LDL, Triglicéridos, HbA1c).
              </span>
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12">
          {/* Indicador de Completitud del Perfil */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                📊 Completitud del Perfil Médico
              </h3>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {profileCompleteness.porcentaje}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileCompleteness.porcentaje}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Requeridos: {profileCompleteness.requeridos}/{profileCompleteness.totalRequeridos}</span>
              <span>Opcionales: {profileCompleteness.opcionales}/{profileCompleteness.totalOpcionales}</span>
            </div>
            {profileCompleteness.porcentaje < 100 && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                💡 Completa los campos opcionales para tener un perfil médico más completo en el historial del paciente.
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4 md:px-8">
            {/* Inputs reorganizados en grid, labels alineados a la izquierda y bien asociados, ahora con placeholders */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre" className="text-left font-semibold">Nombre <span className="text-red-500">*</span></Label>
              <Input id="nombre" placeholder="Ej: Jefferson" value={localFormData.nombre} onChange={e => handleInputChange("nombre", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apellidos" className="text-left font-semibold">Apellidos <span className="text-red-500">*</span></Label>
              <Input id="apellidos" placeholder="Ej: Chunga Zapata" value={localFormData.apellidos} onChange={e => handleInputChange("apellidos", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dni" className="text-left font-semibold">DNI <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="dni" 
                  placeholder="75920737" 
                  value={localFormData.dni} 
                  onChange={e => {
                    const value = e.target.value;
                    handleInputChange("dni", value);
                    // Si el DNI tiene exactamente 8 dígitos, buscar automáticamente
                    if (value.length === 8) {
                      setTimeout(() => handleDniBlur(), 500); // Pequeño delay para evitar búsquedas muy frecuentes
                    }
                  }} 
                  onBlur={handleDniBlur}
                  required 
                  disabled={loading} 
                  className={searchingPatient ? "pr-10" : ""}
                />
                {searchingPatient && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha_nacimiento" className="text-left font-semibold">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
              <Input 
                id="fecha_nacimiento" 
                type="date" 
                placeholder="1990-01-01" 
                value={localFormData.fecha_nacimiento} 
                onChange={e => handleInputChange("fecha_nacimiento", e.target.value)} 
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
                required 
                disabled={loading} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sexo" className="text-left font-semibold">Sexo <span className="text-red-500">*</span></Label>
              <Select value={localFormData.sexo} onValueChange={value => handleInputChange("sexo", value)} disabled={loading}>
                <SelectTrigger id="sexo">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="peso" className="text-left font-semibold">Peso (kg) <span className="text-red-500">*</span></Label>
              <Input id="peso" placeholder="70" value={localFormData.peso} onChange={e => handleInputChange("peso", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="altura" className="text-left font-semibold">Altura (cm) <span className="text-red-500">*</span></Label>
              <Input id="altura" placeholder="170" value={localFormData.altura} onChange={e => handleInputChange("altura", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presion_sistolica" className="text-left font-semibold">Presión Sistólica <span className="text-red-500">*</span></Label>
              <Input id="presion_sistolica" placeholder="120" value={localFormData.presion_sistolica} onChange={e => handleInputChange("presion_sistolica", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presion_diastolica" className="text-left font-semibold">Presión Diastólica <span className="text-red-500">*</span></Label>
              <Input id="presion_diastolica" placeholder="70" value={localFormData.presion_diastolica} onChange={e => handleInputChange("presion_diastolica", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="frecuencia_cardiaca" className="text-left font-semibold">
                Frecuencia Cardíaca
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(Opcional - mejora el perfil)</span>
              </Label>
              <Input id="frecuencia_cardiaca" placeholder="100" value={localFormData.frecuencia_cardiaca} onChange={e => handleInputChange("frecuencia_cardiaca", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol" className="text-left font-semibold">Colesterol Total <span className="text-red-500">*</span></Label>
              <Input id="colesterol" placeholder="200" value={localFormData.colesterol} onChange={e => handleInputChange("colesterol", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol_hdl" className="text-left font-semibold">
                Colesterol HDL
                <span className="text-xs text-green-600 dark:text-green-400 ml-1">(Opcional - "buen" colesterol)</span>
              </Label>
              <Input id="colesterol_hdl" placeholder="50" value={localFormData.colesterol_hdl} onChange={e => handleInputChange("colesterol_hdl", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol_ldl" className="text-left font-semibold">
                Colesterol LDL
                <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">(Opcional - "malo" colesterol)</span>
              </Label>
              <Input id="colesterol_ldl" placeholder="100" value={localFormData.colesterol_ldl} onChange={e => handleInputChange("colesterol_ldl", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="trigliceridos" className="text-left font-semibold">
                Triglicéridos
                <span className="text-xs text-purple-600 dark:text-purple-400 ml-1">(Opcional - grasas en sangre)</span>
              </Label>
              <Input id="trigliceridos" placeholder="150" value={localFormData.trigliceridos} onChange={e => handleInputChange("trigliceridos", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="glucosa" className="text-left font-semibold">Glucosa <span className="text-red-500">*</span></Label>
              <Input id="glucosa" placeholder="120.0" value={localFormData.glucosa} onChange={e => handleInputChange("glucosa", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hemoglobina_glicosilada" className="text-left font-semibold">
                Hemoglobina Glicosilada (HbA1c)
                <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-1">(Opcional - control diabetes)</span>
              </Label>
              <Input id="hemoglobina_glicosilada" placeholder="5.7" value={localFormData.hemoglobina_glicosilada} onChange={e => handleInputChange("hemoglobina_glicosilada", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cigarrillos_dia" className="text-left font-semibold">Cigarrillos por día <span className="text-red-500">*</span></Label>
              <Input id="cigarrillos_dia" placeholder="0" value={localFormData.cigarrillos_dia} onChange={e => handleInputChange("cigarrillos_dia", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="anos_tabaquismo" className="text-left font-semibold">Años de Tabaquismo <span className="text-red-500">*</span></Label>
              <Input id="anos_tabaquismo" placeholder="0" value={localFormData.anos_tabaquismo} onChange={e => handleInputChange("anos_tabaquismo", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="actividad_fisica" className="text-left font-semibold">Actividad Física <span className="text-red-500">*</span></Label>
              <Select value={localFormData.actividad_fisica} onValueChange={value => handleInputChange("actividad_fisica", value)} disabled={loading}>
                <SelectTrigger id="actividad_fisica">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentario</SelectItem>
                  <SelectItem value="ligero">Actividad Ligera</SelectItem>
                  <SelectItem value="moderado">Actividad Moderada</SelectItem>
                  <SelectItem value="intenso">Actividad Intensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="antecedentes_cardiacos" className="text-left font-semibold">Antecedentes Cardíacos</Label>
              <Select value={localFormData.antecedentes_cardiacos} onValueChange={value => handleInputChange("antecedentes_cardiacos", value)} disabled={loading}>
                <SelectTrigger id="antecedentes_cardiacos">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="diabetes" className="text-left font-semibold">Diabetes</Label>
              <Select value={localFormData.diabetes} onValueChange={value => handleInputChange("diabetes", value)} disabled={loading}>
                <SelectTrigger id="diabetes">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hipertension" className="text-left font-semibold">Hipertensión</Label>
              <Select value={localFormData.hipertension} onValueChange={value => handleInputChange("hipertension", value)} disabled={loading}>
                <SelectTrigger id="hipertension">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="numero_historia" className="text-left font-semibold">N° Historia Clínica</Label>
              <Input id="numero_historia" placeholder="HC909090" value={localFormData.numero_historia} onChange={e => handleInputChange("numero_historia", e.target.value)} required disabled={loading} />
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-6">
              <Button 
                type="button" 
                onClick={clearForm}
                disabled={loading}
                variant="outline"
                className="px-6 py-3 text-sm font-medium rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                🧹 Limpiar Formulario
              </Button>
              <Button type="submit" disabled={loading || !isFormValid()} className="px-8 py-3 text-lg font-bold rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white shadow-lg transition-all">
                {loading ? "Procesando..." : "Predecir Riesgo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Modal de resultado de predicción */}
      <PredictionResultModal 
        open={showModal} 
        onClose={() => {
          setShowModal(false)
          // Limpiar formulario cuando se cierre el modal
          setTimeout(() => clearForm(), 300)
        }} 
        predictionResult={predictionResult} 
        formData={formData} 
      />
      
      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        @keyframes heartbeat {
          0%, 50%, 100% { transform: scale(1); }
          25%, 75% { transform: scale(1.1); }
        }
        
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
        
        .animate-progress {
          animation: progress 3s ease-in-out;
        }
      `}</style>
    </TooltipProvider>
  )
}
