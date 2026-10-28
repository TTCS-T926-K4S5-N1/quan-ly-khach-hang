import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
});

export async function connectDB() {
  await prisma.$connect();
}

export async function disconnectDB() {
  await prisma.$disconnect();
}
