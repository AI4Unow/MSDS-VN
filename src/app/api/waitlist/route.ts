import { db } from "@/lib/db/client";
import { waitlistSignups } from "@/lib/db/schema/waitlist";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { email, companyName, role } = await req.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Email không hợp lệ" }, { status: 400 });
  }

  // Check if already signed up
  const existing = await db
    .select({ id: waitlistSignups.id })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.email, email))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ ok: true, message: "Đã đăng ký trước đó" });
  }

  await db.insert(waitlistSignups).values({
    email,
    companyName: companyName || null,
    role: role || null,
    source: "waitlist",
  });

  return Response.json({ ok: true });
}
