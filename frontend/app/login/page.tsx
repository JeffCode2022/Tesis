"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Heart, Activity, TrendingUp, Shield, Users, BarChart3, Info, Sun, Moon, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useTheme } from 'next-themes'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { theme, setTheme } = useTheme()

  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</div>
      </div>
    )
  }

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
      // La redirección ahora se maneja en el hook useAuth
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0FE] via-gray-50 to-[#DBEAFE] dark:from-neutral-950 dark:via-neutral-900 dark:to-black">
          {/* Large blur elements */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/30 dark:bg-[#2563EB]/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/40 dark:bg-gray-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gray-200/50 dark:bg-gray-700/20 rounded-full blur-2xl"></div>
          <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-[#2563EB]/20 dark:bg-[#2563EB]/10 rounded-full blur-xl"></div>
        </div>

        {/* Stronger blur overlay */}
        <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 dark:bg-black/10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center">
        {/* Botón de cambio de tema en la esquina superior derecha */}
        <button
          aria-label="Cambiar tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-20"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800" />
          )}
        </button>
        {/* Left Panel - Login Form */}
        <div className="w-full max-w-lg flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Enhanced Glass Card for Form */}
            <div className="bg-white/70 dark:bg-neutral-800/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-white/10 p-8 relative">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 dark:to-transparent rounded-3xl pointer-events-none"></div>

              <div className="relative z-10">
                {/* Logo */}
                <div className="flex items-center space-x-2 mb-8">
                  <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-2xl font-bold text-black dark:text-white">
                    Cardio<span className="text-[#2563EB]">Predict</span>
                  </span>
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-black dark:text-white mb-2">¡Bienvenido!</h1>
                  <p className="text-gray-600 dark:text-gray-300">Accede a tu sistema de predicción cardiovascular</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50/80 backdrop-blur-sm text-red-600 dark:bg-red-900/50 dark:text-red-300 rounded-xl border border-red-200/50 dark:border-red-500/30 mb-6">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      className="w-full h-12 px-4 bg-white/40 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-inner disabled:opacity-50 text-black dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full h-12 px-4 pr-12 bg-white/40 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-inner disabled:opacity-50 text-black dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={loading}
                        className="border-gray-300 dark:border-white/40 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB] dark:data-[state=checked]:bg-[#2563EB] dark:data-[state=checked]:border-[#2563EB]"
                      />
                      <Label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
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

                {/* MODAL DE SOPORTE - GLASSMORPHISM */}
                <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
                  <DialogContent className="p-0 border-0 overflow-hidden bg-transparent max-w-xs">
                    <DialogTitle className="sr-only">Soporte de Cuenta</DialogTitle>
                    <div className="relative bg-white/90 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/20">
                      {/* Borde superior con gradiente */}
                      <div className="h-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"></div>
                      
                      <div className="relative z-10">
                        {/* Encabezado */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Soporte de Cuenta</h3>
                        </div>
                        
                        {/* Contenido */}
                        <div className="px-5 py-6">
                          <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                            Por tu seguridad, la recuperación o cambio de contraseña
                            <span className="block font-medium text-gray-900 dark:text-white mt-2">
                              solo puede ser gestionada por el área de soporte.
                            </span>
                          </p>
                          
                          <div className="flex justify-end">
                            <button
                              onClick={() => setShowSupportModal(false)}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                              Entendido
                            </button>
                          </div>
                        </div>
                      </div>
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
            <div className="absolute top-0 right-0 bg-gradient-to-br from-[#2563EB]/90 to-[#1E40AF]/90 dark:from-[#2563EB]/95 dark:to-[#1E40AF]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-white/10 p-6 w-64 transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-white">Pacientes en Riesgo</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">23</div>
                <div className="text-white/90 text-sm">Requieren atención inmediata</div>
              </div>
            </div>

            {/* Patients Today Card - Center Left */}
            <div className="absolute top-32 left-0 bg-white/80 dark:bg-neutral-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/10 p-6 w-56 rotate-1 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-100">Pacientes</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-neutral-700/60 backdrop-blur-sm px-2 py-1 rounded-full">Hoy</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-3">1,247</div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-green-600 bg-green-50/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">+12%</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs mes anterior</span>
                </div>
              </div>
            </div>

            {/* Revenue Card - Bottom Center */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/75 dark:bg-neutral-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/10 p-6 w-60 -rotate-1 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100">Ingresos</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">$45,892</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Este mes</div>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200/50 dark:bg-neutral-700/50 backdrop-blur-sm rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: "78%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">78%</span>
                </div>
              </div>
            </div>

            {/* Success Rate Card - Right Center */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-y-8 bg-white/80 dark:bg-neutral-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/10 p-5 w-52 rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Tasa de Éxito</span>
                  <div className="w-8 h-8 bg-[#2563EB]/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">94.7%</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Predicciones correctas</div>
              </div>
            </div>

            {/* Floating Glass Icons - Mejor Posicionados */}
            <div className="absolute top-24 left-1/2 w-12 h-12 bg-white/30 dark:bg-neutral-700/30 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 dark:border-white/10 shadow-xl hover:scale-110 transition-all duration-300">
              <Heart className="w-6 h-6 text-[#2563EB] animate-pulse" />
            </div>
            <div className="absolute bottom-32 right-40 w-10 h-10 bg-[#2563EB]/30 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 dark:border-white/10 shadow-xl hover:scale-110 transition-all duration-300">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-3/4 left-20 w-8 h-8 bg-white/40 dark:bg-neutral-700/40 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/40 dark:border-white/10 shadow-lg hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced floating particles */}
      <div className="absolute top-32 left-16 w-4 h-4 bg-[#2563EB]/40 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute bottom-40 right-1/4 w-6 h-6 bg-white/50 dark:bg-neutral-600/50 rounded-full blur-sm animate-bounce"></div>
      <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-[#2563EB]/60 rounded-full blur-sm animate-pulse"></div>
    </div>
  )
}
