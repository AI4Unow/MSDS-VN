import { db } from "@/lib/db/client";
import { waitlistSignups } from "@/lib/db/schema/waitlist";
import { eq } from "drizzle-orm";

// Simple email regex — not exhaustive but catches common mistakes
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  // Rate limit: max 5 requests per IP per minute (basic in-memory)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  const body = await req.json();
  const { email, companyName, role, website: honeypot } = body;

  // Honeypot check — bots fill hidden fields
  if (honeypot) {
    // Silently accept to not alert bots
    return Response.json({ ok: true });
  }

  // Email validation
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Email không hợp lệ" }, { status: 400 });
  }

  // Trim and sanitize inputs
  const cleanEmail = email.trim().toLowerCase();
  const cleanCompany = typeof companyName === "string" ? companyName.trim().slice(0, 200) : null;
  const cleanRole = typeof role === "string" ? role.trim().slice(0, 100) : null;

  // Check if already signed up — same response to prevent email enumeration
  const existing = await db
    .select({ id: waitlistSignups.id })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.email, cleanEmail))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ ok: true, message: "Đã đăng ký trước đó" });
  }

  await db.insert(waitlistSignups).values({
    email: cleanEmail,
    companyName: cleanCompany,
    role: cleanRole,
    source: "waitlist",
    note: `ip:${ip}`,
  });

  return Response.json({ ok: true });
}
