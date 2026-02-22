'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  consumeFirstAccessSchema,
  ConsumeFirstAccessFormData,
} from '@/lib/schemas/consume-first-access.schema';
import {
  consumeFirstAccessAction,
  ConsumeFirstAccessActionState,
} from '@/actions/consume-first-access.action';
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

interface MagicLinkFirstAccessProps {
  token: string;
  email: string;
}

const initialState: ConsumeFirstAccessActionState = {};

export function MagicLinkFirstAccess({ token, email }: MagicLinkFirstAccessProps) {
  const boundAction = consumeFirstAccessAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  const form = useForm<ConsumeFirstAccessFormData>({
    resolver: zodResolver(consumeFirstAccessSchema),
    defaultValues: { name: '', newPassword: '', confirmPassword: '' },
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {email}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          {isPending ? 'Salvando...' : 'Acessar'}
        </Button>
      </form>
    </Form>
  );
}
