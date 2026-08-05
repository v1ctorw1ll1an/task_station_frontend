"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    contratarMembroAction,
    ContratarMembroActionState,
} from "@/actions/empresa/contratar-membro.action";

interface ContratarMembroModalProps {
    companyId: string;
}

const initialState: ContratarMembroActionState = {};

export function ContratarMembroModal({ companyId }: ContratarMembroModalProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(
        contratarMembroAction,
        initialState,
    );
    const router = useRouter();

    // Conta nova entra na lista de membros na hora → fecha e atualiza. Convite não:
    // a pessoa só aparece depois de aceitar, então o modal fica aberto dizendo isso
    // — fechar em silêncio faria o admin achar que ela já está dentro.
    const convidou = state.success && state.mode === "invited";

    useEffect(() => {
        if (state.success && !state.emailFailed && !convidou) {
            startTransition(() => {
                setOpen(false);
                router.refresh();
            });
            return;
        }
        if (state.success) {
            startTransition(() => {
                router.refresh();
            });
        }
    }, [state.success, state.emailFailed, convidou, router]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar novo colaborador</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="companyId" value={companyId} />

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="João da Silva"
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="joao@empresa.com"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Se o e-mail ainda não tem conta no TaskDY, criamos a
                            conta e enviamos o primeiro acesso. Se já tem,
                            enviamos um convite para entrar nesta empresa.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Telefone{" "}
                            <span className="text-muted-foreground text-xs">
                                (opcional)
                            </span>
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="+55 11 99999-9999"
                        />
                    </div>

                    {convidou && !state.emailFailed && (
                        <div className="rounded-md border border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-700 p-3">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                Convite enviado para {state.email}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                Esse e-mail já tinha conta no TaskDY. A pessoa
                                aparece na lista de membros assim que aceitar o
                                convite.
                            </p>
                        </div>
                    )}

                    {state.emailFailed && state.magicLink && (
                        <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 p-3 space-y-2">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                {convidou
                                    ? "Convite criado, mas o email falhou ao ser enviado."
                                    : "Colaborador criado, mas o email falhou ao ser enviado."}
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                {convidou
                                    ? "Compartilhe o link abaixo para a pessoa aceitar o convite:"
                                    : "Compartilhe o link abaixo com o colaborador para o primeiro acesso:"}
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={state.magicLink}
                                    className="text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            state.magicLink!,
                                        )
                                    }
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>
                    )}

                    {state.error &&
                        (state.seatLimit ? (
                            /* Plano lotado tem uma saída só, e a mensagem já manda
                               contratar — deixar o admin procurar a tela sozinho é
                               pedir para ele desistir no meio do caminho. */
                            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
                                <p className="text-sm text-destructive">{state.error}</p>
                                <Button asChild size="sm" className="w-full">
                                    <Link href={`/empresa/${companyId}/cobranca`}>
                                        Ver planos
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-destructive">{state.error}</p>
                        ))}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Adicionando..." : "Adicionar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
