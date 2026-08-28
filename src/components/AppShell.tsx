import Link from "next/link";
import { Crest } from "./Crest";
import { SideNav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

export function AppShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const roleLabel =
    session.role === "ADMIN"
      ? "Administrator"
      : session.role === "REGISTRAR"
        ? "Registrar"
        : session.role === "FINANCE"
          ? "Bursary"
          : "Student";

  return (
    <div className="min-h-screen bg-paper-100 bg-grid dark:bg-forest-950">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-forest-100 bg-white/90 p-5 backdrop-blur dark:border-forest-800 dark:bg-forest-950/90 lg:flex">
          <Link href={session.role === "STUDENT" ? "/portal" : "/dashboard"} className="mb-8 flex items-center gap-3">
            <Crest className="h-9 w-9" />
            <div>
              <div className="font-display text-lg leading-tight text-forest-900 dark:text-gold-300">
                CampusFlow
              </div>
              <div className="text-[11px] uppercase tracking-wider text-forest-500 dark:text-forest-400">
                {session.tenantName}
              </div>
            </div>
          </Link>
          <SideNav role={session.role} />
          <div className="mt-auto rounded-xl border border-forest-100 bg-forest-50 p-3 dark:border-forest-800 dark:bg-forest-900">
            <div className="text-sm font-medium text-forest-900 dark:text-paper-50">
              {session.name}
            </div>
            <div className="text-xs text-forest-600 dark:text-forest-400">{roleLabel}</div>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="text-xs font-medium text-forest-700 underline-offset-2 hover:underline dark:text-gold-300">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-forest-100 bg-white/80 px-4 py-3 backdrop-blur dark:border-forest-800 dark:bg-forest-950/80 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Crest className="h-8 w-8" />
              <span className="font-display text-base">CampusFlow</span>
            </div>
            <div className="hidden text-sm text-forest-600 dark:text-forest-400 lg:block">
              Student records &amp; institutional fees · NGN
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction} className="lg:hidden">
                <button type="submit" className="btn-ghost text-xs">
                  Sign out
                </button>
              </form>
            </div>
          </header>
          <div className="lg:hidden border-b border-forest-100 bg-white px-3 py-2 dark:border-forest-800 dark:bg-forest-950">
            <SideNav role={session.role} />
          </div>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
