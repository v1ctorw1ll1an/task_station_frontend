import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PerformancePatch } from "@/components/performance-patch";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
