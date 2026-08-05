import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function proxy(request: NextRequest, pathSegments: string[]) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const upstream = `${API_URL}/api/v1/${pathSegments.join('/')}`;
  const method = request.method;
  const authHeader = { Authorization: `Bearer ${session.token}` };

  let res: Response;

  if (method === 'POST') {
    // Forward multipart form data as-is
    const formData = await request.formData();
    res = await fetch(upstream, { method: 'POST', headers: authHeader, body: formData });
  } else if (method === 'DELETE') {
    res = await fetch(upstream, { method: 'DELETE', headers: authHeader });
  } else {
    // GET
    res = await fetch(upstream, { headers: authHeader, cache: 'no-store' });
  }

  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const cacheControl = res.headers.get('cache-control') ?? 'private, max-age=3600';
  // Sem repassar isto, a exportação abre no navegador em vez de baixar com nome.
  const disposition = res.headers.get('content-disposition');

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      ...(disposition ? { 'Content-Disposition': disposition } : {}),
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
