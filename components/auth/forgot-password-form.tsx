'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '@/lib/schemas/forgot-password.schema';
import {
  forgotPasswordAction,
  ForgotPasswordActionState,
} from '@/actions/forgot-password.action';
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

const initialState: ForgotPasswordActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Se esse email estiver cadastrado, você receberá um link para redefinir sua senha em
          instantes.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Voltar ao login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">Voltar ao login</Link>
        </Button>
      </form>
    </Form>
  );
}
