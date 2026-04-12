import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      orgId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    orgId?: string | null;
  }
}
