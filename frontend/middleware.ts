import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value || request.headers.get('authorization');
  const url = request.url;

  // Se o utilizador tentar aceder a rotas protegidas sem token, redireciona para o login
  const isProtectedPath = 
    url.includes('/dashboard') || 
    url.includes('/workout') || 
    url.includes('/reading') || 
    url.includes('/habits');

  // Nota: Como o teu token atual está guardado no localStorage (que o servidor Next.js no middleware não consegue ler diretamente por razões de segurança), 
  // o ideal é garantirmos que o login também guarda o token num cookie ou ajustarmos a verificação para o cookie.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/workout/:path*', '/reading/:path*', '/habits/:path*'],
}