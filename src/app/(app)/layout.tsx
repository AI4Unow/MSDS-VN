import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth disabled — pass mock user to AppShell
  const mockUser = {
    id: "dev-user",
    name: "Dev User",
    email: "dev@msds.local",
    orgId: "dev-org",
  };

  return <AppShell user={mockUser}>{children}</AppShell>;
}
