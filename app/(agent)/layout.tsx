import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/properties/new",
    label: "New Strategy",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const initials = session.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : session.user?.email?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-black/20 backdrop-blur-xl px-4 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-500 text-xs font-bold shadow-lg shadow-[var(--accent)]/20">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight">Seller Strategy</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-purple-500/30 text-xs font-semibold border border-[var(--border)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{session.user?.name ?? "Agent"}</p>
              <p className="truncate text-[11px] text-[var(--muted)]">{session.user?.email}</p>
            </div>
          </div>
          <div className="mt-3 px-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-black/40 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-500 text-xs font-bold">
            S
          </div>
          <span className="text-sm font-semibold">Seller Strategy</span>
        </div>
        <div className="flex items-center gap-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-[var(--muted)] hover:text-white transition-colors">
              {item.icon}
            </Link>
          ))}
          <SignOutButton />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 md:mt-0 mt-14 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
