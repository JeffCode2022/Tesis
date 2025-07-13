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
      console.log('[useAuth] Iniciando proceso de login...');
      
      // Validar credenciales
      if (!email || !password) {
        throw { message: 'Por favor, ingresa tu correo y contraseña', isValidationError: true };
      }

      const response = await authService.login({ email, password, rememberMe });
      
      // Verificar si la respuesta es válida
      if (!response || !response.user) {
        throw { message: 'Respuesta del servidor inválida', isServerError: true };
      }

      console.log('[useAuth] Login exitoso. Actualizando estado...');
      
      // Actualizar estado
      setIsAuthenticated(true);
      setUser(response.user);
      
      console.log('[useAuth] Redirigiendo a /dashboard...');
      
      // Usar el router de Next.js para la navegación
      router.push('/dashboard');
      
      return response;
      
    } catch (error: any) {
      // Si el error es de cancelación, no hacer nada
      if (error?.isCanceled) {
        console.log('[useAuth] Operación cancelada por el usuario');
        return;
      }

      // Formatear el mensaje de error
      let errorMessage = 'Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.';
      let errorType = 'UNKNOWN_ERROR';

      // Manejar diferentes tipos de errores
      if (error?.isNetworkError) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
        errorType = 'NETWORK_ERROR';
      } else if (error?.isTimeout) {
        errorMessage = 'La solicitud está tardando demasiado. Por favor, verifica tu conexión e inténtalo de nuevo.';
        errorType = 'TIMEOUT_ERROR';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Correo o contraseña incorrectos. Por favor, verifica tus credenciales.';
        errorType = 'INVALID_CREDENTIALS';
      } else if (error?.isValidationError) {
        errorMessage = error.message;
        errorType = 'VALIDATION_ERROR';
      } else if (error?.isServerError) {
        errorMessage = error.message;
        errorType = 'SERVER_ERROR';
      } else if (error.response?.data?.message) {
        // Si el servidor envía un mensaje de error, usarlo
        errorMessage = error.response.data.message;
        errorType = error.response.data.code || 'API_ERROR';
      }

      // Log detallado solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('[useAuth] Error en el proceso de login:', {
          error,
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          type: errorType,
          stack: error?.stack
        });
      }

      // Lanzar un error con el mensaje formateado
      const authError = new Error(errorMessage) as any;
      authError.type = errorType;
      
      throw authError;
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