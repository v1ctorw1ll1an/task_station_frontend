import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

/**
 * Porta de entrada única: quem chega aqui cria a própria conta e ganha o trial.
 * A entrada de funcionário (conta sem empresa, que dependia de convite) saiu da
 * tela — o fluxo de adicionar alguém a uma empresa será redefinido depois.
 */
export default async function RegisterPage() {
    if (process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "true") {
        redirect("/login");
    }

    const session = await getSession();
    if (session && !session.user.mustResetPassword) {
        redirect("/dashboard");
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
                    Criar sua conta
                </CardTitle>
                <CardDescription>
                    Teste grátis por 7 dias, sem cartão.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RegisterForm />
            </CardContent>
        </Card>
    );
}
