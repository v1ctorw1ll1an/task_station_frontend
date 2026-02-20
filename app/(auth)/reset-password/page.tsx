import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmResetPasswordForm } from '@/components/auth/confirm-reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/forgot-password');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Crie uma nova senha para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
