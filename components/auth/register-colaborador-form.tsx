'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import {
  registerColaboradorSchema,
  RegisterColaboradorFormData,
} from '@/lib/schemas/register-colaborador.schema';
import {
  registerColaboradorAction,
  RegisterColaboradorActionState,
} from '@/actions/register-colaborador.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const initialState: RegisterColaboradorActionState = {};

export function RegisterColaboradorForm() {
  const [state, formAction, isPending] = useActionState(registerColaboradorAction, initialState);

  const form = useForm<RegisterColaboradorFormData>({
    resolver: zodResolver(registerColaboradorSchema),
    defaultValues: { name: '', email: '' },
  });

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <MailCheck className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Confira seu e-mail</p>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de ativação para <span className="font-medium">{state.email}</span>.
            Clique nele para definir sua senha — depois mostramos o que pedir ao seu gerente para
            entrar na empresa.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seu nome</FormLabel>
              <FormControl>
                <Input placeholder="Maria Souza" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormDescription>
                Use o e-mail que seu gerente vai usar para te convidar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar minha conta'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </Form>
  );
}
