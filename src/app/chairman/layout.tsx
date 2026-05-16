import { requireRole } from "@/lib/auth/require-role";
import Link from "next/link";

const navItems = [
  { href: "/chairman/dashboard", label: "Overview" },
  { href: "/chairman/sandbox", label: "Sandbox" },
  { href: "/chairman/budget", label: "Budget" },
  { href: "/chairman/subsidiaries", label: "Subsidiaries" },
  { href: "/chairman/risks", label: "Risks" },
];

export default async function ChairmanLayout({ children }: { children: React.ReactNode }) {
  await requireRole("chairman");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/chairman/dashboard" className="font-bold text-lg mr-8">
            Bộ Não Số
          </Link>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
