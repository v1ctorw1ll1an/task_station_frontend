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
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
    searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const session = await getSession();
    if (session && !session.user.mustResetPassword) {
        redirect("/dashboard");
    }

    const { reset } = await searchParams;

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
                {reset === "success" && (
                    <p className="mb-4 text-sm text-green-600">
                        Senha redefinida com sucesso. Faça login com a nova
                        senha.
                    </p>
                )}
                <LoginForm />
            </CardContent>
        </Card>
    );
}
