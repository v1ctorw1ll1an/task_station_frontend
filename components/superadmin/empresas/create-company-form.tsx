'use client';

import { useEffect, useActionState, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { PlusCircle, Info, Mail, Link2, Check, UserCog } from 'lucide-react';
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
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialState);
  const router = useRouter();

  const form = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { legalName: '', taxId: '', adminName: '', adminEmail: '' },
  });

  useEffect(() => {
    if (state.success) {
      setCreatedAdminEmail(form.getValues('adminEmail'));
      setMagicLink(state.magicLink ?? null);
      form.reset();
      router.refresh();
    }
  }, [state.success, state.magicLink, form, router]);

  function handleClose() {
    setOpen(false);
    setCreatedAdminEmail(null);
    setMagicLink(null);
    setCopied(false);
  }

  function handleCopy() {
    if (!magicLink) return;
    void navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              {state.emailSent && magicLink ? (
                <>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Um link de primeiro acesso foi enviado para{' '}
                      <strong className="text-foreground">{createdAdminEmail}</strong>. A entrega pode levar alguns minutos.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Link2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Caso o email não chegue, copie o link abaixo e repasse diretamente ao administrador:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs truncate">
                      {magicLink}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      O link expira em 7 dias e só pode ser usado uma vez. O administrador precisará definir nome e senha ao acessá-lo.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <UserCog className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      O usuário <strong className="text-foreground">{createdAdminEmail}</strong> já existia no sistema e foi vinculado como administrador da nova empresa.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Nenhum email foi enviado — o usuário já possui acesso ao sistema com suas credenciais atuais.
                    </p>
                  </div>
                </>
              )}
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
                        <FormLabel>Nome <span className="text-muted-foreground font-normal text-xs">(ignorado se o email já existe no sistema)</span></FormLabel>
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
