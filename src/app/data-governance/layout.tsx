import Link from "next/link";

export default function DataGovernanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/data-governance/quality" className="font-bold text-lg mr-8">
            Data Governance
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/data-governance/quality"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Quality
            </Link>
            <Link
              href="/data-governance/sources"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sources
            </Link>
            <Link
              href="/data-governance/council"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Council
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
