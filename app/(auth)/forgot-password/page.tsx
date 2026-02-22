import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session && !session.user.mustResetPassword) {
    redirect('/dashboard');
  }
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Esqueceu a senha?</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
