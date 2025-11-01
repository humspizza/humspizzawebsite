// Test script to verify .env is loaded correctly
import 'dotenv/config';

console.log('=== Testing .env Loading ===\n');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
  `✅ LOADED (length: ${process.env.DATABASE_URL.length} chars)` : 
  '❌ NOT FOUND');

console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 
  `✅ LOADED (length: ${process.env.SESSION_SECRET.length} chars)` : 
  '❌ NOT FOUND');

console.log('NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');

console.log('\n=== Database Connection Test ===\n');

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const urlObj = new URL(dbUrl.replace('postgresql://', 'postgres://'));
  
  console.log('Host:', urlObj.hostname);
  console.log('Database:', urlObj.pathname.substring(1));
  console.log('User:', urlObj.username);
  console.log('Has sslmode:', dbUrl.includes('sslmode') ? '✅ Yes' : '❌ No');
  
  if (dbUrl.includes('sslmode=')) {
    const sslmode = urlObj.searchParams.get('sslmode');
    console.log('SSL Mode:', sslmode);
  }
} else {
  console.log('❌ Cannot test - DATABASE_URL not found');
}

console.log('\n=== Test Complete ===');
