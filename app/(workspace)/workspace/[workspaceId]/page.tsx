import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

// A raiz do workspace não tem conteúdo próprio — redireciona para a aba padrão.
// Evita 404 ao acessar /workspace/{id} direto (bookmark, URL digitada, histórico).
export default async function WorkspaceRootPage({ params }: PageProps) {
  const { workspaceId } = await params;
  redirect(`/workspace/${workspaceId}/projetos`);
}
