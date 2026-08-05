import { NextResponse } from 'next/server';

/**
 * Saída da sessão derrubada (um assento = um login).
 *
 * Server Component não pode apagar cookie, então mandar direto para `/login` deixava
 * o cookie velho no navegador — e o `/login` devolvia para o `/dashboard`, que tomava
 * 401 de novo: ping-pong infinito (C12). Aqui, num Route Handler, o cookie morre de
 * verdade antes do redirect.
 */
export function GET(request: Request) {
  const destino = new URL('/login?sessao=encerrada', request.url);
  const res = NextResponse.redirect(destino);
  res.cookies.delete('access_token');
  res.cookies.delete('user');
  return res;
}
