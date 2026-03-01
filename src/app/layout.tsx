import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinApp - Gestão Financeira Pessoal",
  description: "Gerencie suas finanças pessoais de forma simples e eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-surface-alt text-on-surface min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
