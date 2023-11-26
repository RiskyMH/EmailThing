// Import required dependencies
import { Client } from '@planetscale/database';
import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

function getDB() {
  // Initialize Prisma Client with the PlanetScale serverless database driver
  const client = new Client({ url: process.env.DATABASE_URL });
  const adapter = new PrismaPlanetScale(client);
  const prisma = new PrismaClient({ adapter, log: ["query"] });

  return { client, prisma }
}

declare namespace global {
  let db: ReturnType<typeof getDB> | undefined
}

const db = global.db || getDB()

if (process.env.NODE_ENV === "development") global.db = db

export const client = db.client
export const prisma = db.prisma
export default db.prisma