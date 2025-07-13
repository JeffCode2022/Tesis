"use client"

import { useState } from "react"
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [searchingPatient, setSearchingPatient] = useState(false)

  const handleInputChange = (field: string, value: string) => {
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
      const predictionData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        dni: formData.dni,
        fecha_nacimiento: formData.fecha_nacimiento,
        sexo: formData.sexo,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        presionSistolica: parseInt(formData.presion_sistolica),
        presionDiastolica: parseInt(formData.presion_diastolica),
        colesterol: formData.colesterol ? parseFloat(formData.colesterol) : 0,
        colesterol_hdl: formData.colesterol_hdl ? parseFloat(formData.colesterol_hdl) : 0,
        colesterol_ldl: formData.colesterol_ldl ? parseFloat(formData.colesterol_ldl) : 0,
        trigliceridos: formData.trigliceridos ? parseFloat(formData.trigliceridos) : 0,
        glucosa: formData.glucosa ? parseFloat(formData.glucosa) : 0,
        hemoglobina_glicosilada: formData.hemoglobina_glicosilada ? parseFloat(formData.hemoglobina_glicosilada) : 0,
        cigarrillosDia: parseInt(formData.cigarrillos_dia),
        anosTabaquismo: parseInt(formData.anos_tabaquismo),
        actividadFisica: formData.actividad_fisica,
        antecedentesCardiacos: formData.antecedentes_cardiacos,
        numero_historia: formData.numero_historia,
      }
      console.log('[PredictionForm] Datos enviados a predict:', predictionData)
      const result = await predictionService.predict(predictionData)
      setPredictionResult({ ...result, ...formData })
      setShowModal(true)
      onPredict(result)
    } catch (error: any) {
      setError(error.message || "Error al realizar la predicción. Por favor, intente nuevamente.");
    } finally {
      setLoading(false)
      console.log('[PredictionForm] Procesamiento finalizado')
    }
  }

  const isFormValid = () => {
    return (
      formData.nombre &&
      formData.apellidos &&
      formData.dni &&
      formData.fecha_nacimiento &&
      formData.sexo &&
      formData.peso &&
      formData.altura &&
      formData.presion_sistolica &&
      formData.presion_diastolica &&
      formData.numero_historia
    )
  }

  const handleDniBlur = async () => {
    if (formData.dni && formData.dni.length === 8) {
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
        if (result.exists && result.data) {
          setError("");
          const patient = result.data;
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
        } else {
          setError("No se encontró un paciente con ese DNI.");
          onFormChange("nombre", "");
          onFormChange("apellidos", "");
          onFormChange("fecha_nacimiento", "");
          onFormChange("sexo", "");
          onFormChange("numero_historia", "");
          onFormChange("peso", "");
          onFormChange("altura", "");
        }
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
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 dark:bg-gradient-to-br w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Formulario de Predicción</CardTitle>
          <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Completa los datos del paciente para predecir el riesgo cardiovascular.
            <p className="text-sm mt-2">Los campos marcados con <span className="text-red-500">*</span> son necesarios para la predicción del modelo.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12">
          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4 md:px-8">
            {/* Inputs reorganizados en grid, labels alineados a la izquierda y bien asociados, ahora con placeholders */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre" className="text-left font-semibold">Nombre <span className="text-red-500">*</span></Label>
              <Input id="nombre" placeholder="Ej: Jefferson" value={formData.nombre} onChange={e => handleInputChange("nombre", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apellidos" className="text-left font-semibold">Apellidos <span className="text-red-500">*</span></Label>
              <Input id="apellidos" placeholder="Ej: Chunga Zapata" value={formData.apellidos} onChange={e => handleInputChange("apellidos", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dni" className="text-left font-semibold">DNI <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="dni" 
                  placeholder="75920737" 
                  value={formData.dni} 
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
              <Input id="fecha_nacimiento" type="date" placeholder="2000-09-30" value={formData.fecha_nacimiento} onChange={e => handleInputChange("fecha_nacimiento", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sexo" className="text-left font-semibold">Sexo <span className="text-red-500">*</span></Label>
              <Select value={formData.sexo} onValueChange={value => handleInputChange("sexo", value)} disabled={loading}>
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
              <Input id="peso" placeholder="70" value={formData.peso} onChange={e => handleInputChange("peso", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="altura" className="text-left font-semibold">Altura (cm) <span className="text-red-500">*</span></Label>
              <Input id="altura" placeholder="170" value={formData.altura} onChange={e => handleInputChange("altura", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presion_sistolica" className="text-left font-semibold">Presión Sistólica <span className="text-red-500">*</span></Label>
              <Input id="presion_sistolica" placeholder="120" value={formData.presion_sistolica} onChange={e => handleInputChange("presion_sistolica", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presion_diastolica" className="text-left font-semibold">Presión Diastólica <span className="text-red-500">*</span></Label>
              <Input id="presion_diastolica" placeholder="70" value={formData.presion_diastolica} onChange={e => handleInputChange("presion_diastolica", e.target.value)} required disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="frecuencia_cardiaca" className="text-left font-semibold">Frecuencia Cardíaca</Label>
              <Input id="frecuencia_cardiaca" placeholder="100" value={formData.frecuencia_cardiaca} onChange={e => handleInputChange("frecuencia_cardiaca", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol" className="text-left font-semibold">Colesterol Total <span className="text-red-500">*</span></Label>
              <Input id="colesterol" placeholder="200" value={formData.colesterol} onChange={e => handleInputChange("colesterol", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol_hdl" className="text-left font-semibold">Colesterol HDL</Label>
              <Input id="colesterol_hdl" placeholder="50" value={formData.colesterol_hdl} onChange={e => handleInputChange("colesterol_hdl", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colesterol_ldl" className="text-left font-semibold">Colesterol LDL</Label>
              <Input id="colesterol_ldl" placeholder="100" value={formData.colesterol_ldl} onChange={e => handleInputChange("colesterol_ldl", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="trigliceridos" className="text-left font-semibold">Triglicéridos</Label>
              <Input id="trigliceridos" placeholder="150" value={formData.trigliceridos} onChange={e => handleInputChange("trigliceridos", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="glucosa" className="text-left font-semibold">Glucosa <span className="text-red-500">*</span></Label>
              <Input id="glucosa" placeholder="120.0" value={formData.glucosa} onChange={e => handleInputChange("glucosa", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hemoglobina_glicosilada" className="text-left font-semibold">Hemoglobina Glicosilada (HbA1c)</Label>
              <Input id="hemoglobina_glicosilada" placeholder="5.7" value={formData.hemoglobina_glicosilada} onChange={e => handleInputChange("hemoglobina_glicosilada", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cigarrillos_dia" className="text-left font-semibold">Cigarrillos por día <span className="text-red-500">*</span></Label>
              <Input id="cigarrillos_dia" placeholder="0" value={formData.cigarrillos_dia} onChange={e => handleInputChange("cigarrillos_dia", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="anos_tabaquismo" className="text-left font-semibold">Años de Tabaquismo <span className="text-red-500">*</span></Label>
              <Input id="anos_tabaquismo" placeholder="0" value={formData.anos_tabaquismo} onChange={e => handleInputChange("anos_tabaquismo", e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="actividad_fisica" className="text-left font-semibold">Actividad Física <span className="text-red-500">*</span></Label>
              <Select value={formData.actividad_fisica} onValueChange={value => handleInputChange("actividad_fisica", value)} disabled={loading}>
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
              <Select value={formData.antecedentes_cardiacos} onValueChange={value => handleInputChange("antecedentes_cardiacos", value)} disabled={loading}>
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
              <Select value={formData.diabetes} onValueChange={value => handleInputChange("diabetes", value)} disabled={loading}>
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
              <Select value={formData.hipertension} onValueChange={value => handleInputChange("hipertension", value)} disabled={loading}>
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
              <Input id="numero_historia" placeholder="HC909090" value={formData.numero_historia} onChange={e => handleInputChange("numero_historia", e.target.value)} required disabled={loading} />
            </div>
            <div className="col-span-full flex justify-end mt-6">
              <Button type="submit" disabled={loading || !isFormValid()} className="w-full md:w-auto px-8 py-3 text-lg font-bold rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white shadow-lg transition-all">
                {loading ? "Procesando..." : "Predecir Riesgo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Modal de resultado de predicción */}
      <PredictionResultModal open={showModal} onClose={() => setShowModal(false)} predictionResult={predictionResult} formData={formData} />
    </TooltipProvider>
  )
}
