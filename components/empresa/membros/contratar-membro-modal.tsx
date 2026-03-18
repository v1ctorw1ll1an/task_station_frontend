"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
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

    useEffect(() => {
        if (state.success && !state.emailFailed) {
            startTransition(() => {
                setOpen(false);
                router.refresh();
            });
        }
        if (state.success && state.emailFailed) {
            startTransition(() => {
                router.refresh();
            });
        }
    }, [state.success, state.emailFailed, router]);

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
                            Um link de primeiro acesso será enviado para este
                            email.
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

                    {state.emailFailed && state.magicLink && (
                        <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 p-3 space-y-2">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                Colaborador criado, mas o email falhou ao ser enviado.
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                Compartilhe o link abaixo com o colaborador para o primeiro acesso:
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

                    {state.error && (
                        <p className="text-sm text-destructive">
                            {state.error}
                        </p>
                    )}

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
