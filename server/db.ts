import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL and remove sslmode parameter for pg driver
let connectionString = process.env.DATABASE_URL;
let sslConfig: any = false; // Default: no SSL

if (connectionString.includes('sslmode=')) {
  const url = new URL(connectionString.replace('postgresql://', 'postgres://'));
  const sslmode = url.searchParams.get('sslmode');
  
  // Remove sslmode from connection string
  url.searchParams.delete('sslmode');
  connectionString = url.toString();
  
  // Configure SSL based on sslmode
  if (sslmode === 'require') {
    sslConfig = { rejectUnauthorized: false };
  } else if (sslmode === 'none' || sslmode === 'disable') {
    sslConfig = false;
  }
}

// Use standard PostgreSQL driver instead of Neon serverless
// This works with any PostgreSQL server (Neon, custom servers, etc.)
export const pool = new Pool({ 
  connectionString,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });