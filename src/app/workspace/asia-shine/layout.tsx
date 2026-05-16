import Link from "next/link";

export default function AsiaShineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/workspace/asia-shine/coas" className="font-bold text-lg mr-8">
            Asia Shine Legal/QC
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/workspace/asia-shine/coas"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              COAs
            </Link>
            <Link
              href="/workspace/asia-shine/suppliers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Suppliers
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
