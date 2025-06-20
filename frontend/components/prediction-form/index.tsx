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

interface FormData {
  nombre: string
  apellidos: string
  dni: string
  edad: string
  sexo: string
  peso: string
  altura: string
  presionSistolica: string
  presionDiastolica: string
  colesterol: string
  glucosa: string
  cigarrillosDia: string
  anosTabaquismo: string
  actividadFisica: string
  antecedentesCardiacos: string
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

  // Cálculo de IMC en tiempo real
  const imc = useMemo(() => {
    const peso = parseFloat(formData.peso)
    const altura = parseFloat(formData.altura)
    if (!peso || !altura || peso <= 0 || altura <= 0) return null
    const alturaM = altura / 100
    return peso / (alturaM * alturaM)
  }, [formData.peso, formData.altura])

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { label: "Bajo peso", color: "text-blue-600 dark:text-blue-400" }
    if (imc < 25) return { label: "Normal", color: "text-green-600 dark:text-green-400" }
    if (imc < 30) return { label: "Sobrepeso", color: "text-yellow-600 dark:text-yellow-400" }
    return { label: "Obesidad", color: "text-red-600 dark:text-red-400" }
  }

  const handleInputChange = (field: string, value: string) => {
    onFormChange(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const predictionData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        dni: formData.dni,
        edad: parseInt(formData.edad),
        sexo: formData.sexo,
        peso: parseFloat(formData.peso),
        altura: parseInt(formData.altura),
        presionSistolica: parseInt(formData.presionSistolica),
        presionDiastolica: parseInt(formData.presionDiastolica),
        colesterol: parseFloat(formData.colesterol),
        glucosa: parseFloat(formData.glucosa),
        cigarrillosDia: parseInt(formData.cigarrillosDia),
        anosTabaquismo: parseInt(formData.anosTabaquismo),
        actividadFisica: formData.actividadFisica || 'sedentario',
        antecedentesCardiacos: formData.antecedentesCardiacos || 'no',
        diabetes: false,
        hipertension: false,
        numero_historia: formData.numero_historia,
      }
      console.log('Datos enviados a predict:', predictionData)
      const result = await predictionService.predict(predictionData)
      onPredict(result)
    } catch (err) {
      setError("Error al procesar la predicción. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.nombre &&
      formData.apellidos &&
      formData.dni &&
      formData.edad &&
      formData.sexo &&
      formData.peso &&
      formData.altura &&
      formData.presionSistolica &&
      formData.presionDiastolica &&
      formData.numero_historia
    )
  }

  const handleDniBlur = async () => {
    if (formData.dni && formData.dni.length === 8) {
      try {
        const patients = await patientService.getPatientByDni(formData.dni)
        const patient = patients.find(p => p.dni === formData.dni)
        if (patient) {
          let nombre = patient.nombre || ""
          let apellidos = patient.apellidos || ""
          if ((!nombre || !apellidos) && patient.nombre_completo) {
            const partes = patient.nombre_completo.trim().split(" ")
            nombre = partes[0] || ""
            apellidos = partes.slice(1).join(" ") || ""
          }
          onFormChange("nombre", nombre)
          onFormChange("apellidos", apellidos)
          onFormChange("edad", patient.edad ? String(patient.edad) : "")
          onFormChange("sexo", patient.sexo || "")
          onFormChange("numero_historia", patient.numero_historia || "")
        } else {
          onFormChange("nombre", "")
          onFormChange("apellidos", "")
          onFormChange("edad", "")
          onFormChange("sexo", "")
          onFormChange("numero_historia", "")
        }
      } catch (e) {
        onFormChange("nombre", "")
        onFormChange("apellidos", "")
        onFormChange("edad", "")
        onFormChange("sexo", "")
        onFormChange("numero_historia", "")
      }
    }
  }

  return (
    <TooltipProvider>
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Evaluación Cardiovascular
          </CardTitle>
          <CardDescription className="text-blue-100">
            Sistema de análisis predictivo con inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos personales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Información Personal</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="nombre" className="text-gray-700 font-medium">
                    Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Nombre del paciente"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellidos" className="text-gray-700 font-medium">
                    Apellidos *
                  </Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange("apellidos", e.target.value)}
                    placeholder="Apellidos del paciente"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dni" className="text-gray-700 font-medium">
                    DNI *
                  </Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    onBlur={handleDniBlur}
                    placeholder="Número de DNI"
                    className="border-gray-300 focus:border-blue-500"
                    required
                    pattern="[0-9]{8}"
                    title="Ingrese un DNI válido de 8 dígitos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edad" className="text-gray-700 font-medium">
                    Edad *
                  </Label>
                  <Input
                    id="edad"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.edad}
                    onChange={(e) => handleInputChange("edad", e.target.value)}
                    placeholder="Años"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sexo" className="text-gray-700 font-medium">
                    Sexo *
                  </Label>
                  <Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)} required>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Seleccionar sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="numero_historia" className="text-gray-700 font-medium">
                  Número de Historia Clínica *
                </Label>
                <Input
                  id="numero_historia"
                  value={formData.numero_historia}
                  onChange={(e) => handleInputChange("numero_historia", e.target.value)}
                  placeholder="Ej. HC12345"
                  className="border-gray-300 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Medidas antropométricas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Medidas Antropométricas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="peso" className="text-gray-700 font-medium">
                    Peso (kg) *
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => handleInputChange("peso", e.target.value)}
                    placeholder="70"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="altura" className="text-gray-700 font-medium">
                    Altura (cm) *
                  </Label>
                  <Input
                    id="altura"
                    type="number"
                    min="100"
                    max="250"
                    value={formData.altura}
                    onChange={(e) => handleInputChange("altura", e.target.value)}
                    placeholder="170"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              {/* IMC en tiempo real */}
              <div className="mt-2">
                <div className="inline-block px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 shadow text-sm">
                  <span className="font-semibold text-gray-800 dark:text-white">IMC: </span>
                  <span className="font-bold text-lg">
                    {imc ? imc.toFixed(2) : "N/A"}
                  </span>
                  {imc && (
                    <span className={`ml-3 font-semibold ${getIMCCategory(imc).color}`}>{getIMCCategory(imc).label}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Parámetros clínicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Parámetros Clínicos</h3>
              <div className="grid grid-cols-2 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="presionSistolica" className="text-gray-700 font-medium">
                        Presión Sistólica *
                      </Label>
                      <Input
                        id="presionSistolica"
                        type="number"
                        min="70"
                        max="250"
                        value={formData.presionSistolica}
                        onChange={(e) => handleInputChange("presionSistolica", e.target.value)}
                        placeholder="120"
                        className="border-gray-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Presión arterial sistólica normal: 90-120 mmHg</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="presionDiastolica" className="text-gray-700 font-medium">
                        Presión Diastólica *
                      </Label>
                      <Input
                        id="presionDiastolica"
                        type="number"
                        min="40"
                        max="150"
                        value={formData.presionDiastolica}
                        onChange={(e) => handleInputChange("presionDiastolica", e.target.value)}
                        placeholder="80"
                        className="border-gray-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Presión arterial diastólica normal: 60-80 mmHg</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colesterol" className="text-gray-700 font-medium">
                    Colesterol (mg/dL)
                  </Label>
                  <Input
                    id="colesterol"
                    type="number"
                    min="100"
                    max="500"
                    value={formData.colesterol}
                    onChange={(e) => handleInputChange("colesterol", e.target.value)}
                    placeholder="200"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="glucosa" className="text-gray-700 font-medium">
                    Glucosa (mg/dL)
                  </Label>
                  <Input
                    id="glucosa"
                    type="number"
                    min="50"
                    max="400"
                    value={formData.glucosa}
                    onChange={(e) => handleInputChange("glucosa", e.target.value)}
                    placeholder="100"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Hábitos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Hábitos y Estilo de Vida</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cigarrillosDia" className="text-gray-700 font-medium">
                    Cigarrillos/día
                  </Label>
                  <Input
                    id="cigarrillosDia"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cigarrillosDia}
                    onChange={(e) => handleInputChange("cigarrillosDia", e.target.value)}
                    placeholder="0"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="anosTabaquismo" className="text-gray-700 font-medium">
                    Años fumando
                  </Label>
                  <Input
                    id="anosTabaquismo"
                    type="number"
                    min="0"
                    max="80"
                    value={formData.anosTabaquismo}
                    onChange={(e) => handleInputChange("anosTabaquismo", e.target.value)}
                    placeholder="0"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="actividadFisica" className="text-gray-700 font-medium">
                  Actividad Física
                </Label>
                <Select
                  value={formData.actividadFisica}
                  onValueChange={(value) => handleInputChange("actividadFisica", value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Nivel de actividad física" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentario</SelectItem>
                    <SelectItem value="ligero">Actividad ligera</SelectItem>
                    <SelectItem value="moderado">Actividad moderada</SelectItem>
                    <SelectItem value="intenso">Actividad intensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="antecedentesCardiacos" className="text-gray-700 font-medium">
                  Antecedentes Familiares
                </Label>
                <Select
                  value={formData.antecedentesCardiacos}
                  onValueChange={(value) => handleInputChange("antecedentesCardiacos", value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="¿Hay antecedentes familiares?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="desconoce">No sabe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
              size="lg"
            >
              <Heart className="mr-2 h-5 w-5" />
              {loading ? "Procesando..." : "Analizar con IA"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
