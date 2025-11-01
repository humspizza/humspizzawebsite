import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL and configure SSL
let connectionString = process.env.DATABASE_URL;
let sslConfig: any = false; // Default: no SSL

// Clean up connection string and determine SSL mode
if (connectionString.includes('sslmode=')) {
  const url = new URL(connectionString.replace('postgresql://', 'postgres://'));
  const sslmode = url.searchParams.get('sslmode');
  
  // Remove sslmode from connection string (pg driver doesn't accept it)
  url.searchParams.delete('sslmode');
  connectionString = url.toString();
  
  // Configure SSL based on sslmode parameter
  if (sslmode === 'require') {
    sslConfig = { rejectUnauthorized: false };
  } else if (sslmode === 'none' || sslmode === 'disable') {
    sslConfig = false;
  }
}

// IMPORTANT: Force disable SSL for this custom database server
// This prevents "Hostname/IP does not match certificate's altnames" errors
// Works for both IP (103.138.88.63) and domain (s88d63.cloudnetwork.vn)
if (connectionString.includes('103.138.88.63') || 
    connectionString.includes('s88d63.cloudnetwork.vn')) {
  sslConfig = false;
  console.log('🔓 SSL disabled for custom database connection');
}

// Use standard PostgreSQL driver instead of Neon serverless
// This works with any PostgreSQL server (Neon, custom servers, etc.)
export const pool = new Pool({ 
  connectionString,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });