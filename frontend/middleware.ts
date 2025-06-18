import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir acceso libre a /login, /register y recursos estáticos y de Next.js
  const publicPaths = ['/login', '/register', '/api', '/public', '/static', '/_next'];
  const { pathname } = request.nextUrl;

  // Si la ruta es pública, permitir acceso
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Buscar el token de acceso en las cookies
  const authToken = request.cookies.get('auth_token')?.value;
  // (Opcional: mantener la comprobación de is_authenticated para compatibilidad)
  // const isAuthenticatedCookie = request.cookies.get('is_authenticated')?.value;

  // Si no hay token, redirigir a /login
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto las públicas
    '/((?!login|register|_next|favicon.ico|api|public|static).*)',
  ],
}; 