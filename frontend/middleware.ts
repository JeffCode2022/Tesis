import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir acceso libre a /login, /register y recursos estáticos
  const publicPaths = ['/login', '/register', '/_next', '/favicon.ico', '/api', '/public'];
  const { pathname } = request.nextUrl;

  // Si la ruta es pública, permitir acceso
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Buscar el token en cookies (SSR) o en el header (por si acaso)
  const token = request.cookies.get('auth_token')?.value || request.headers.get('Authorization');

  // Si no hay token, redirigir a /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto las públicas
    '/((?!login|register|_next|favicon.ico|api|public).*)',
  ],
}; 