import { getSession } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/logout.action';

export default async function DashboardPage() {
  const session = await getSession();

  // O layout já garante session !== null, mas TypeScript precisa disso
  if (!session) return null;

  const { user } = session;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              Sair
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{user.id}</span>

              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>

              <span className="text-muted-foreground">Superusuário</span>
              <span>{user.isSuperuser ? 'Sim' : 'Não'}</span>

              <span className="text-muted-foreground">Redefinir senha</span>
              <span>{user.mustResetPassword ? 'Pendente' : 'Concluído'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
