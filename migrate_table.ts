import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const rawUrl = process.env.DATABASE_URL!;
  const url = new URL(rawUrl);
  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: false
  });
  const res = await pool.query('ALTER TABLE reservations ADD COLUMN IF NOT EXISTS table_number text');
  console.log('OK:', res.command);
  await pool.end();
}

main().catch(console.error);
