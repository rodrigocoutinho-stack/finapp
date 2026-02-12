"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/contas", label: "Contas" },
  { href: "/categorias", label: "Categorias" },
  { href: "/transacoes", label: "Transações" },
  { href: "/recorrentes", label: "Recorrentes" },
  { href: "/fluxo-diario", label: "Fluxo Diário" },
  { href: "/investimentos", label: "Investimentos" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function linkClass(href: string) {
    const active = pathname === href;
    return `text-sm font-medium ${
      active
        ? "text-emerald-600"
        : "text-gray-600 hover:text-gray-900"
    }`;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-emerald-600">
              FinApp
            </Link>
            <div className="hidden sm:flex gap-6">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sair
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2 ${linkClass(link.href)}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  );
}
