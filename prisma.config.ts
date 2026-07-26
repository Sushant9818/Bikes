import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI-only (migrate, studio, db pull, etc.) — the runtime client in lib/prisma.ts
    // builds its own pooled connection directly from DATABASE_URL and never reads this
    // file. Prisma 7's config Datasource type has no directUrl field, so this must be
    // the direct/session connection: the pgbouncer transaction pooler (DATABASE_URL)
    // hangs the schema engine on drift/migrate commands.
    url: process.env.DIRECT_URL,
  },
})
