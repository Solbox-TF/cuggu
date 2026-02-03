import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = process.env.DATABASE_URL;

// Serverless 환경 최적화
// prepare: false = Vercel Serverless에 최적화
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
