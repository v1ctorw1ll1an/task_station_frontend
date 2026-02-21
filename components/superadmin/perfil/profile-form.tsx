'use client';

import { useEffect, useActionState, useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { updateProfileAction, UpdateProfileActionState } from '@/actions/superadmin/update-profile.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
  };
}

const initialState: UpdateProfileActionState = {};

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  // Limpa a mensagem de sucesso após 4 segundos
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-8">
      {/* Dados pessoais */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Dados pessoais</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData.name}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData.email}
            placeholder="seu@email.com"
          />
          <p className="text-xs text-muted-foreground">
            Ao alterar o email, use o novo endereço para fazer login.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={initialData.phone}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <Separator />

      {/* Alteração de senha */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Alterar senha</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deixe em branco para manter a senha atual.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova senha</Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {showSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Perfil atualizado com sucesso.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
