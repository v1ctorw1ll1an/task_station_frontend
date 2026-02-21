import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ProfileForm } from '@/components/superadmin/perfil/profile-form';

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/superadmin/usuarios/${session.user.id}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  // Busca os dados completos do usuário (nome, email, telefone)
  const userData = res.ok ? await res.json() : null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seus dados pessoais e senha de acesso.
        </p>
      </div>

      <ProfileForm
        initialData={{
          name: userData?.name ?? '',
          email: userData?.email ?? session.user.email,
          phone: userData?.phone ?? '',
        }}
      />
    </div>
  );
}
