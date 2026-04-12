import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import { users, accounts, sessions, verificationTokens, organizations } from "@/lib/db/schema";
import { auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { auth, handlers, signIn, signOut } = NextAuth({
  /* adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }), */
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "noreply@sds-platform.example",
    }),
  ],
  events: {
    async signIn({ user, isNewUser }) {
      // Mock db insertion
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.orgId = user.orgId;
      }
      return session;
    },
  },
});

async function bootstrapPersonalOrg(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const [org] = await db
    .insert(organizations)
    .values({
      name: user.name ?? user.email ?? "Personal Org",
      locale: "vi",
      plan: "free",
    })
    .returning();

  if (org) {
    await db.update(users).set({ orgId: org.id }).where(eq(users.id, user.id));
  }
}
