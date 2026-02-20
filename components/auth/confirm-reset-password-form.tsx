'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  confirmResetPasswordSchema,
  ConfirmResetPasswordFormData,
} from '@/lib/schemas/confirm-reset-password.schema';
import {
  confirmResetPasswordAction,
  ConfirmResetPasswordActionState,
} from '@/actions/confirm-reset-password.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const initialState: ConfirmResetPasswordActionState = {};

interface ConfirmResetPasswordFormProps {
  token: string;
}

export function ConfirmResetPasswordForm({ token }: ConfirmResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(confirmResetPasswordAction, initialState);

  const form = useForm<ConfirmResetPasswordFormData>({
    resolver: zodResolver(confirmResetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        {/* Token passado como campo oculto para a server action */}
        <input type="hidden" name="token" value={token} />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Redefinir senha'}
        </Button>
      </form>
    </Form>
  );
}
