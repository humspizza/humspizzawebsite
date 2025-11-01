import 'dotenv/config'; // CRITICAL: Load .env BEFORE accessing process.env
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { Pool } = pg;

// IMPORTANT: Force use custom database by reading .env file directly
// This prevents Replit's environment variable from overriding our config
let databaseUrl = process.env.DATABASE_URL;

// Force override: Read DATABASE_URL from .env file if exists
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match && match[1]) {
    databaseUrl = match[1].trim();
    console.log('✅ Using DATABASE_URL from .env file (not Replit environment)');
  }
} catch (error) {
  console.log('⚠️ Could not read .env file, using environment variable');
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL and configure SSL
let connectionString = databaseUrl;
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