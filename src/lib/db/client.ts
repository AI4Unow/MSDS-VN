/* eslint-disable @typescript-eslint/no-explicit-any */
// import { drizzle } from "drizzle-orm/vercel-postgres";
// import { sql } from "@vercel/postgres";
// import * as schema from "./schema";

const createMockBuilder = (data: unknown[] = []) => {
  const builder: Record<string, unknown> = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(data);
        }
        if (prop === "catch" || prop === "finally") {
          return builder;
        }
        return () => builder;
      },
    }
  );
  return builder;
};

// Export heavily mocked DB client to prevent missing POSTGRES_URL crashes
export const db = new Proxy(
  {} as Record<string, unknown>,
  {
    get(target, prop) {
      if (
        prop === "select" ||
        prop === "insert" ||
        prop === "update" ||
        prop === "delete" ||
        prop === "query"
      ) {
        return () => createMockBuilder([]);
      }
      return createMockBuilder([]);
    },
  }
) as any; // single cast needed for drizzle API compatibility
