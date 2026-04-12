// import { drizzle } from "drizzle-orm/vercel-postgres";
// import { sql } from "@vercel/postgres";
import * as schema from "./schema";

const createMockBuilder = (data: any = []) => {
  const builder: any = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === "then") {
          return (resolve: any) => resolve(data);
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
export const db: any = new Proxy(
  {},
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
);
