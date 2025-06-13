import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/services/auth"

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const currentPathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(authService.getUser())
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    const checkAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated()
        if (isMounted.current) {
          setIsAuthenticated(authenticated)
          setUser(authService.getUser())
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    const interval = setInterval(async () => {
      if (isAuthenticated) {
        await authService.checkAndRefreshToken()
      }
    }, 240000)

    return () => {
      isMounted.current = false
      clearInterval(interval)
    }
  }, [])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authService.login({ email, password, rememberMe })
      setIsAuthenticated(true)
      setUser(response.user)
      router.push("/dashboard")
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    confirmPassword: string
    nombre: string
  }) => {
    try {
      const response = await authService.register(data)
      setIsAuthenticated(true)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
  }
} 