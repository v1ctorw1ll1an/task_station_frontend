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
        if (state.success) {
            startTransition(() => {
                setOpen(false);
                router.refresh();
            });
        }
    }, [state.success, router]);

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
                    <DialogTitle>Contratar novo colaborador</DialogTitle>
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
                            {isPending ? "Contratando..." : "Contratar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
