import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
    provider: "postgresql",
  },
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    adapter: async () => {
      const { PrismaNeon } = await import("@prisma/adapter-neon");
      const { neonConfig } = await import("@neondatabase/serverless");
      const ws = await import("ws");
      neonConfig.webSocketConstructor = ws.default;
      const connectionString = process.env.DATABASE_URL!;
      return new PrismaNeon({ connectionString });
    },
  },
});