import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PerformancePatch } from "@/components/performance-patch";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Fontes hospedadas no projeto, NÃO via `next/font/google`.
 *
 * O `next/font/google` baixa os arquivos durante o `next build` — o que torna o
 * deploy refém de rede: sem saída para `fonts.gstatic.com`, o Turbopack aborta o
 * build inteiro (não é aviso, é erro). Pior, a camada do Docker mascara a falha
 * até alguém invalidá-la, e aí o build quebra num deploy que não mexeu em nada
 * disso. Os .woff2 são os mesmos que ele baixaria (Geist v5 / Geist Mono v6,
 * variáveis, subset latin) — só que versionados.
 */
const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskDY",
  description: "Plataforma de gestão de projetos Kanban com hierarquia multi-tenant.",
  icons: {
    icon: [
      { url: '/taskDY/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/taskDY/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/taskDY/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PerformancePatch />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
