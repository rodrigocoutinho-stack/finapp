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
  { href: "/fluxo-previsto", label: "Fluxo Previsto" },
  { href: "/investimentos", label: "Investimentos" },
  { href: "/configuracoes", label: "Config." },
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

  function isActive(href: string) {
    return pathname === href;
  }

  function desktopLinkClass(href: string) {
    const active = isActive(href);
    return `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      active
        ? "bg-emerald-50 text-emerald-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;
  }

  function mobileLinkClass(href: string) {
    const active = isActive(href);
    return `block py-2 text-sm font-medium rounded-lg px-3 transition-colors ${
      active
        ? "bg-emerald-50 text-emerald-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;
  }

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-emerald-600">
              FinApp
            </Link>
            <div className="hidden md:flex gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={desktopLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="hidden md:block text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Sair
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu de navegação"
              aria-expanded={mobileOpen}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-2 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={mobileLinkClass(link.href)}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left py-2 px-3 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  );
}
