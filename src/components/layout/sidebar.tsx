"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/contexts/preferences-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { UserAvatar } from "./user-avatar";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconExtra?: React.ReactNode;
};

type NavGroup = {
  id: string;
  label: string;
  links: NavLink[];
};

const dashboardLink: NavLink = {
  href: "/",
  label: "Dashboard",
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  ),
};

const configuracaoLink: NavLink = {
  href: "/configuracoes",
  label: "Configurações",
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
  ),
  iconExtra: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  ),
};

const navGroups: NavGroup[] = [
  {
    id: "movimentacoes",
    label: "Movimentações",
    links: [
      {
        href: "/contas",
        label: "Contas",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3"
          />
        ),
      },
      {
        href: "/transacoes",
        label: "Transações",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        ),
      },
      {
        href: "/recorrentes",
        label: "Recorrentes",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
          />
        ),
      },
    ],
  },
  {
    id: "planejamento",
    label: "Planejamento",
    links: [
      {
        href: "/metas",
        label: "Metas",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
          />
        ),
      },
      {
        href: "/dividas",
        label: "Dívidas",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
          />
        ),
      },
      {
        href: "/investimentos",
        label: "Investimentos",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        ),
      },
    ],
  },
  {
    id: "analise",
    label: "Análise",
    links: [
      {
        href: "/historico",
        label: "Histórico",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6.75"
          />
        ),
      },
      {
        href: "/fluxo",
        label: "Fluxo",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        ),
      },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    links: [
      {
        href: "/assistente",
        label: "Assistente IA",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        ),
      },
      {
        href: "/simuladores",
        label: "Simuladores",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 15.75V18m-7.5-6.75V18m15-8.25l-3.172 3.172a4 4 0 01-2.828 1.172H6.75a4 4 0 01-2.828-1.172L.75 9.75m0 0V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 0113.548 0c1.131.094 1.976 1.057 1.976 2.192V9.75m-18 0h18"
          />
        ),
      },
    ],
  },
];

// Flat list for collapsed icon-only mode
const allGroupLinks: NavLink[] = navGroups.flatMap((g) => g.links);

function getActiveGroupId(pathname: string): string | null {
  for (const group of navGroups) {
    for (const link of group.links) {
      if (pathname.startsWith(link.href)) return group.id;
    }
  }
  return null;
}

function NavIcon({ link }: { link: NavLink }) {
  return (
    <svg
      className="w-5 h-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      {link.icon}
      {link.iconExtra}
    </svg>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { fullName } = usePreferences();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = getActiveGroupId(pathname);
    return active ? new Set([active]) : new Set(["movimentacoes"]);
  });

  // Auto-expand the group of the active route on navigation
  useEffect(() => {
    const active = getActiveGroupId(pathname);
    if (active) {
      setOpenGroups((prev) => {
        if (prev.has(active)) return prev;
        return new Set([...prev, active]);
      });
    }
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function linkClass(href: string, indent = false) {
    const active = isActive(href);
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      indent ? "pl-9" : ""
    } ${
      active
        ? "bg-slate-800 text-emerald-400"
        : "text-on-surface-muted hover:text-white hover:bg-slate-800/60"
    }`;
  }

  // ── Grouped nav (expanded desktop + mobile) ──────────────────────────────
  function GroupedNav({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
    return (
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Dashboard standalone */}
        <Link href={dashboardLink.href} className={linkClass(dashboardLink.href)}>
          <NavIcon link={dashboardLink} />
          <span className="truncate">{dashboardLink.label}</span>
        </Link>

        {/* Groups */}
        {navGroups.map((group) => {
          const open = alwaysOpen || openGroups.has(group.id);
          const hasActive = group.links.some((l) => isActive(l.href));

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => !alwaysOpen && toggleGroup(group.id)}
                className={`flex items-center justify-between w-full px-3 py-2 mt-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  hasActive
                    ? "text-emerald-400"
                    : "text-slate-500 hover:text-slate-300"
                } ${alwaysOpen ? "cursor-default" : "cursor-pointer"}`}
              >
                <span>{group.label}</span>
                {!alwaysOpen && (
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>

              {/* Group links */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-0.5 pb-1">
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className={linkClass(link.href, true)}>
                      <NavIcon link={link} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  // ── Collapsed icon-only nav ───────────────────────────────────────────────
  function CollapsedNav() {
    return (
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {[dashboardLink, ...allGroupLinks, configuracaoLink].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
              isActive(link.href)
                ? "bg-slate-800 text-emerald-400"
                : "text-on-surface-muted hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <NavIcon link={link} />
          </Link>
        ))}
      </nav>
    );
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  function Footer({ collapsedMode = false }: { collapsedMode?: boolean }) {
    if (collapsedMode) {
      return (
        <div className="px-2 py-4 border-t border-slate-700/50 flex flex-col items-center gap-2">
          <UserAvatar name={fullName} size="sm" />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair"
            className="p-2 rounded-lg text-on-surface-muted hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <div className="px-3 py-4 border-t border-slate-700/50">
        {/* Configurações standalone */}
        <Link href={configuracaoLink.href} className={`${linkClass(configuracaoLink.href)} mb-2`}>
          <NavIcon link={configuracaoLink} />
          <span className="truncate">{configuracaoLink.label}</span>
        </Link>

        {/* User + logout */}
        <div className="flex items-center gap-3 px-3 py-2">
          <UserAvatar name={fullName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{fullName || "Usuário"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-sm font-medium text-on-surface-muted hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sair
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-slate-900 z-30 transition-all duration-300 ${
          collapsed ? "lg:w-[68px]" : "lg:w-60"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center py-5 shrink-0 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            {collapsed ? "F" : "FinApp"}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Recolher menu"
              className="p-1.5 rounded-lg text-on-surface-muted hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Expand button (collapsed only) */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Expandir menu"
            className="mx-auto mb-2 p-1.5 rounded-lg text-on-surface-muted hover:text-white hover:bg-slate-800/60 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {collapsed ? <CollapsedNav /> : <GroupedNav />}
        <Footer collapsedMode={collapsed} />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 z-30 flex items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          FinApp
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu de navegação"
          aria-expanded={mobileOpen}
          className="p-2 text-on-surface-muted hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 shrink-0">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            FinApp
          </Link>
        </div>
        <GroupedNav alwaysOpen />
        <Footer />
      </aside>
    </>
  );
}
