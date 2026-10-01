import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Volta do consentimento do Google. Fica no front porque é aqui que existe a sessão:
 * repassamos `code` + `state` à API **autenticados**, e a API confere que o `state`
 * foi emitido para este mesmo usuário (um link forjado não liga a agenda de outra
 * pessoa à conta de quem o forjou).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const back = (query: Record<string, string>) => {
    const url = new URL('/perfil/integracoes', request.url);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    return NextResponse.redirect(url);
  };

  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/login', request.url));

  // Usuário negou o consentimento (ou o Google devolveu erro).
  if (params.get('error')) return back({ google: 'cancelled' });

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return back({ google: 'error' });

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/google/callback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ code, state }),
        cache: 'no-store',
      },
    );
    // Só códigos fixos na URL: texto livre na query viraria mensagem arbitrária na tela.
    if (res.status === 403) return back({ google: 'error', reason: 'forbidden' });
    if (res.status === 400) return back({ google: 'error', reason: 'expired' });
    if (!res.ok) return back({ google: 'error' });
    return back({ google: 'connected' });
  } catch {
    return back({ google: 'error' });
  }
}
