import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function FirstAccessPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.user.mustResetPassword) {
    redirect('/dashboard');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Defina sua senha</CardTitle>
        <CardDescription>
          Este é seu primeiro acesso. Crie uma nova senha para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
