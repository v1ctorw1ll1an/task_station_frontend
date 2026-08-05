'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { registerSchema, RegisterFormData } from '@/lib/schemas/register.schema';
import { registerAction, RegisterActionState } from '@/actions/register.action';
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
import { mascaraCpfCnpj, mascaraTelefone } from '@/lib/mascaras';

const initialState: RegisterActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { legalName: '', taxId: '', ownerName: '', email: '', phone: '' },
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
            Clique nele para definir sua senha e começar o teste grátis de 7 dias.
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
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razão social</FormLabel>
              <FormControl>
                <Input placeholder="Acme Ltda" autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ ou CPF</FormLabel>
              <FormControl>
                {/* A máscara é aplicada no onChange (não por posição do cursor), então
                    colar um valor já formatado ou apagar no meio continua funcionando.
                    O envio tira a máscara — quem faz isso é o transform do schema. */}
                <Input
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  {...field}
                  onChange={(e) => field.onChange(mascaraCpfCnpj(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seu nome</FormLabel>
              <FormControl>
                <Input placeholder="João Silva" autoComplete="name" {...field} />
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
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>Enviaremos o link de ativação para este e-mail.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                {/* Mesma abordagem do CPF/CNPJ: máscara no onChange, envio só com
                    dígitos via transform do schema. */}
                <Input
                  placeholder="(11) 98765-4321"
                  inputMode="tel"
                  autoComplete="tel"
                  {...field}
                  onChange={(e) => field.onChange(mascaraTelefone(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar a conta'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </form>
    </Form>
  );
}
