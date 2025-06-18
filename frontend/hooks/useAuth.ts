import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { authService, clearAuthData } from "@/lib/services/auth"

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const currentPathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(authService.getUser())
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    console.log('[useAuth] useEffect: Verificando autenticación inicial.');
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        let authenticated = false;
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            const now = Date.now() / 1000;
            if (decoded.exp && decoded.exp > now) {
              authenticated = true;
            } else {
              // Token expirado
              clearAuthData();
              authenticated = false;
              window.location.href = "/login";
              return;
            }
          } catch (e) {
            // Token inválido
            clearAuthData();
            authenticated = false;
            window.location.href = "/login";
            return;
          }
        }
        if (isMounted.current) {
          setIsAuthenticated(authenticated)
          setUser(authService.getUser())
          console.log('[useAuth] useEffect: Estado de autenticación establecido:', { authenticated, user: authService.getUser() });
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
          console.log('[useAuth] useEffect: isLoading establecido a false.');
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
      console.log('[useAuth] Login exitoso: Estado de autenticación actualizado.', { isAuthenticated: true, user: response.user });
      window.location.href = "/dashboard"
      return response
    } catch (error) {
      console.error('[useAuth] Error en el login:', error);
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