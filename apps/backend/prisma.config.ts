import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "../../packages/database/prisma",
  migrations: {
    path: "../../packages/database/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
