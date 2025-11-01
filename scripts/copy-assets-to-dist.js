#!/usr/bin/env node

/**
 * ⚠️ DEPRECATED: This script is NO LONGER NEEDED!
 * 
 * The server now automatically reads files from ../attached_assets/ in production.
 * No need to copy files to dist/attached_assets/ anymore.
 * 
 * Just run: npm run build
 * Then deploy the entire project folder (including attached_assets/ at root).
 * 
 * See BUILD_INSTRUCTIONS.md for details.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('⚠️  DEPRECATED: This script is no longer needed!');
console.log('');
console.log('✅ Server now reads from ../attached_assets/ automatically.');
console.log('');
console.log('📦 To build for production:');
console.log('   1. npm run build');
console.log('   2. Deploy entire project folder (attached_assets/ + dist/)');
console.log('');
console.log('See BUILD_INSTRUCTIONS.md for details.');
console.log('');

// Check if files exist to help with verification
const srcDir = path.join(rootDir, 'attached_assets');
if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir).filter(f => {
    const stat = fs.statSync(path.join(srcDir, f));
    return stat.isFile();
  });
  console.log(`✅ Found ${files.length} files in attached_assets/ (ready for deployment)`);
} else {
  console.log('⚠️  attached_assets/ directory not found');
}
