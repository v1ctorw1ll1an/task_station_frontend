'use client';

import { useEffect, useActionState, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { PlusCircle, Info, Mail, KeyRound, UserCog } from 'lucide-react';
import { createCompanySchema, CreateCompanyFormData } from '@/lib/schemas/create-company.schema';
import { createCompanyAction, CreateCompanyActionState } from '@/actions/superadmin/create-company.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const initialState: CreateCompanyActionState = {};

export function CreateCompanyForm() {
  const [open, setOpen] = useState(false);
  const [createdAdminEmail, setCreatedAdminEmail] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialState);
  const router = useRouter();

  const form = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { legalName: '', taxId: '', adminName: '', adminEmail: '' },
  });

  useEffect(() => {
    if (state.success) {
      setCreatedAdminEmail(form.getValues('adminEmail'));
      form.reset();
      router.refresh();
    }
  }, [state.success, form, router]);

  function handleClose() {
    setOpen(false);
    setCreatedAdminEmail(null);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdAdminEmail ? 'Empresa criada com sucesso' : 'Criar Empresa'}
          </DialogTitle>
        </DialogHeader>

        {createdAdminEmail ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <KeyRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Uma <strong className="text-foreground">senha temporária foi gerada automaticamente</strong> pelo sistema e enviada ao email do administrador. A senha nunca é armazenada em texto simples — apenas seu hash é salvo no banco de dados.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  O email de boas-vindas com as credenciais está sendo enviado para{' '}
                  <strong className="text-foreground">{createdAdminEmail}</strong>. A entrega pode levar alguns minutos.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <UserCog className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Caso o email não seja recebido, você pode <strong className="text-foreground">alterar a senha manualmente</strong> pelo painel de usuários e repassá-la ao administrador. O usuário será obrigado a redefinir a senha no primeiro acesso.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  O administrador só conseguirá acessar o sistema após redefinir a senha temporária. Esse comportamento é obrigatório e não pode ser ignorado.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Entendi</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form action={formAction} className="space-y-4">
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Empresa LTDA" {...field} />
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
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00000000000100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Admin da Empresa</p>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Criando...' : 'Criar Empresa'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
