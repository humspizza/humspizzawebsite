#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const srcDir = path.join(rootDir, 'attached_assets');
const destDir = path.join(rootDir, 'dist', 'attached_assets');

try {
  // Create attached_assets if it doesn't exist
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
    console.log('✅ Created attached_assets directory');
  }

  // Create dist/attached_assets
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy all files
  const files = fs.readdirSync(srcDir);
  let copied = 0;

  files.forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    
    // Only copy files (not directories)
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      copied++;
    }
  });

  console.log(`✅ Copied ${copied} files from attached_assets/ to dist/attached_assets/`);
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
