"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Heart } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Bienvenido</CardTitle>
          <CardDescription className="text-center text-blue-100">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Recordarme
              </Label>
            </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-xl transition-all shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>

          <div className="space-y-2 text-center">
            {/* Enlace de recuperación de contraseña eliminado */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
