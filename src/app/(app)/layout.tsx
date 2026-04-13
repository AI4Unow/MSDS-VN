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
    email: "dev@ai4u.now",
    orgId: "00000000-0000-0000-0000-000000000001",
  };

  return <AppShell user={mockUser}>{children}</AppShell>;
}
