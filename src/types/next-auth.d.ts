import { DefaultSession } from "next-auth";
import type { userRoleEnum } from "@/lib/db/schema/auth";

type UserRole = (typeof userRoleEnum.enumValues)[number];

declare module "next-auth" {
  interface Session {
    user: {
      orgId?: string | null;
      role?: UserRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    orgId?: string | null;
    role?: UserRole | null;
  }
}
