"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Heart, Activity, TrendingUp, Shield, Users, BarChart3, Info } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login: Limpiando error y estableciendo loading.")
    setError("")
    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error("Por favor, complete todos los campos")
      }

      const loginResponse = await login(email, password, rememberMe)
      console.log("Login exitoso, respuesta:", loginResponse)
      router.push("/dashboard")
      console.log("Login: Redirigiendo a /dashboard...")
    } catch (err: any) {
      console.error("Error en el login:", err)
      if (err.response?.status === 401) {
        setError("Credenciales inválidas. Por favor, verifique su correo y contraseña.")
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || "Datos de inicio de sesión inválidos")
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("Error al iniciar sesión. Por favor, intente nuevamente.")
      }
    } finally {
      setLoading(false)
      console.log("Login: Loading establecido en false.")
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Enhanced Background with Blur */}
      <div className="absolute inset-0">
        {/* Complex medical background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0FE] via-gray-50 to-[#DBEAFE]">
          {/* Large blur elements */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/30 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/40 dark:bg-gray-900/40 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gray-200/50 rounded-full blur-2xl"></div>
          <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-[#2563EB]/20 rounded-full blur-xl"></div>
        </div>

        {/* Stronger blur overlay */}
        <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 dark:bg-gray-900/5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center">
        {/* Left Panel - Login Form */}
        <div className="w-full max-w-lg flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Enhanced Glass Card for Form */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700 p-8 relative">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>

              <div className="relative z-10">
                {/* Logo */}
                <div className="flex items-center space-x-2 mb-8">
                  <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-2xl font-bold text-black">
                    Cardio<span className="text-[#2563EB]">Predict</span>
                  </span>
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-black mb-2">¡Bienvenido!</h1>
                  <p className="text-gray-600">Accede a tu sistema de predicción cardiovascular</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl border border-red-200/50 mb-6">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@clinica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full h-12 px-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/40 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-300 shadow-inner disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full h-12 px-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/40 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-300 shadow-inner disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={loading}
                        className="border-white/40 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                      />
                      <Label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Recordarme
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-[#2563EB] text-sm font-medium hover:underline focus:outline-none"
                      onClick={() => setShowSupportModal(true)}
                      tabIndex={0}
                    >
                      ¿Contraseña olvidada?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-xl transition-all shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>

                {/* MODAL DE SOPORTE */}
                <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
                  <DialogContent className="max-w-xs p-0 border border-[#2563EB] shadow-xl rounded-xl bg-white dark:bg-gray-900 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-t-xl bg-[#2563EB]">
                      <Info className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold text-base">Soporte de Cuenta</span>
                    </div>
                    <div className="px-4 pt-3 pb-2 flex flex-col items-center">
                      <p className="text-gray-700 text-sm text-center mb-3 mt-1">
                        Por tu seguridad, la recuperación o cambio de contraseña<br />
                        <span className="font-semibold">solo puede ser gestionada por el área de soporte.</span>
                      </p>
                      <button
                        className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-semibold shadow hover:bg-[#1E40AF] transition-all text-sm mt-1"
                        onClick={() => setShowSupportModal(false)}
                      >
                        Entendido
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Well-Positioned Floating Glass Cards */}
        <div className="hidden lg:flex w-[700px] relative overflow-visible items-center justify-center p-8">
          <div className="relative w-full h-[600px]">
            {/* Patients at Risk Card - Top Right */}
            <div className="absolute top-0 right-0 bg-gradient-to-br from-[#2563EB]/90 to-[#1E40AF]/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-6 w-64 transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-white">Pacientes en Riesgo</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">23</div>
                <div className="text-white/90 text-sm">Requieren atención inmediata</div>
              </div>
            </div>

            {/* Patients Today Card - Center Left */}
            <div className="absolute top-32 left-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700 p-6 w-56 rotate-1 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="font-bold text-gray-800">Pacientes</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-2 py-1 rounded-full">Hoy</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-3">1,247</div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-green-600 bg-green-50/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">+12%</span>
                  </div>
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                </div>
              </div>
            </div>

            {/* Revenue Card - Bottom Center */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/75 dark:bg-gray-900/75 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700 p-6 w-60 -rotate-1 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-800">Ingresos</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">$45,892</div>
                <div className="text-sm text-gray-600 mb-3">Este mes</div>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: "78%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">78%</span>
                </div>
              </div>
            </div>

            {/* Success Rate Card - Right Center */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-y-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700 p-5 w-52 rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Tasa de Éxito</span>
                  <div className="w-8 h-8 bg-[#2563EB]/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">94.7%</div>
                <div className="text-xs text-gray-600">Predicciones correctas</div>
              </div>
            </div>

            {/* Floating Glass Icons - Mejor Posicionados */}
            <div className="absolute top-24 left-1/2 w-12 h-12 bg-white/30 dark:bg-gray-900/30 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 dark:border-gray-700 shadow-xl hover:scale-110 transition-all duration-300">
              <Heart className="w-6 h-6 text-[#2563EB] animate-pulse" />
            </div>
            <div className="absolute bottom-32 right-40 w-10 h-10 bg-[#2563EB]/30 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 shadow-xl hover:scale-110 transition-all duration-300">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-3/4 left-20 w-8 h-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 dark:border-gray-700 shadow-lg hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced floating particles */}
      <div className="absolute top-32 left-16 w-4 h-4 bg-[#2563EB]/40 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute bottom-40 right-1/4 w-6 h-6 bg-white/50 dark:bg-gray-900/50 rounded-full blur-sm animate-bounce"></div>
      <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-[#2563EB]/60 rounded-full blur-sm animate-pulse"></div>
    </div>
  )
}
