#!/usr/bin/env node

/**
 * Fix deployment structure by moving files from dist/public to dist
 * This script addresses the deployment issue where files are built to dist/public
 * but deployment expects them in dist
 */

import fs from 'fs';
import path from 'path';

function fixDeploymentStructure() {
  const distPublicPath = path.join(process.cwd(), 'dist', 'public');
  const distPath = path.join(process.cwd(), 'dist');

  console.log('Fixing deployment structure...');
  
  // Check if dist/public exists
  if (!fs.existsSync(distPublicPath)) {
    console.log('dist/public directory not found. Build may not have completed.');
    process.exit(1);
  }

  // Get all files and directories in dist/public
  const items = fs.readdirSync(distPublicPath);
  
  console.log(`Moving ${items.length} items from dist/public to dist...`);

  // Move each item from dist/public to dist
  items.forEach(item => {
    const sourcePath = path.join(distPublicPath, item);
    const targetPath = path.join(distPath, item);
    
    try {
      // If target exists, remove it first
      if (fs.existsSync(targetPath)) {
        if (fs.statSync(targetPath).isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(targetPath);
        }
      }
      
      // Move the item
      fs.renameSync(sourcePath, targetPath);
      console.log(`Moved: ${item}`);
    } catch (error) {
      console.error(`Error moving ${item}:`, error.message);
    }
  });

  // Remove the now-empty dist/public directory
  try {
    fs.rmdirSync(distPublicPath);
    console.log('Removed empty dist/public directory');
  } catch (error) {
    console.error('Error removing dist/public directory:', error.message);
  }

  console.log('Deployment structure fixed successfully!');
  console.log('Files are now in dist/ as expected by deployment.');
}

// Run the fix
fixDeploymentStructure();