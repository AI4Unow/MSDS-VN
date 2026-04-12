import { auth } from "@/lib/auth/auth-config";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const orgId = (session.user as { orgId?: string | null }).orgId;
  if (!orgId) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
