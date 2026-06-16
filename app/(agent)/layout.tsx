import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-8">
        <Link href="/dashboard" className="text-base font-semibold tracking-tight whitespace-nowrap sm:text-lg">
          Seller Strategy
        </Link>
        <div className="flex items-center gap-3 text-sm text-[var(--muted)] sm:gap-4">
          <span className="hidden truncate sm:inline">{session.user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
