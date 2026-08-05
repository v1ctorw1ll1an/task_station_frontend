import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
    searchParams: Promise<{ reset?: string; sessao?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { reset, sessao, next } = await searchParams;

    // Só caminho interno vira destino pós-login (o server action revalida).
    const destino =
        next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

    // Chegando por sessão derrubada, NÃO devolve para o dashboard mesmo que reste
    // cookie: era exatamente esse rebote que virava loop infinito (C12).
    const session = sessao === "encerrada" ? null : await getSession();
    if (session && !session.user.mustResetPassword) {
        redirect(destino ?? "/dashboard");
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Image
                        src="/taskDY/taskDY.png"
                        alt="TaskDY"
                        width={28}
                        height={28}
                    />
                    TaskDY
                </CardTitle>
                <CardDescription>
                    Entre com seu email e senha para continuar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {sessao === "encerrada" && (
                    <p className="mb-4 text-sm text-amber-600">
                        Sua sessão foi encerrada porque esta conta entrou em
                        outro dispositivo. Cada usuário permite um acesso por
                        vez — entre novamente para continuar aqui.
                    </p>
                )}
                {reset === "success" && (
                    <p className="mb-4 text-sm text-green-600">
                        Senha redefinida com sucesso. Faça login com a nova
                        senha.
                    </p>
                )}
                <LoginForm next={destino} />
                {process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true" && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Não tem conta?{" "}
                        <Link
                            href="/register"
                            className="text-foreground underline-offset-4 hover:underline"
                        >
                            Criar conta grátis
                        </Link>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
