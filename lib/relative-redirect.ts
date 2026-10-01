import { NextResponse } from 'next/server';

/**
 * Redirect com `Location` relativo (ex.: `/login`), resolvido pelo navegador contra o
 * domínio que ele está acessando. `new URL(path, request.url)` não serve atrás do proxy:
 * no container o `request.url` é `http://0.0.0.0:3000/...`, e o usuário ia parar lá.
 */
export function relativeRedirect(path: string, status = 307): NextResponse {
  return new NextResponse(null, { status, headers: { Location: path } });
}
