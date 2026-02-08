import type { Metadata } from "next";
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
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
