import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../../../lib/generated/prisma/client";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "").replace("file://", "") ??
  "./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbPath });

export const prisma = new PrismaClient({ adapter });
