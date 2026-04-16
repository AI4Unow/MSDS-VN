import { redirect } from "next/navigation";

export default async function LegacyPublicCardRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/public/card/${token}`);
}
