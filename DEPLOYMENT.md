# Deployment Guide

## Issue Resolution

This project had a deployment structure issue where the build process creates files in `dist/public/` but deployment expects them in `dist/`. 

## Fix Applied

A deployment fix script has been created to resolve this issue:

### Option 1: Automated Production Build (Recommended)
Use the production build script that automatically fixes file structure:

```bash
./build-production.sh
```

### Option 2: Manual Fix
Run the fix script after building:

```bash
npm run build
node fix-deployment.js
```

### Option 3: Automated Build Process
If you need to automate this in your deployment pipeline, you can run:

```bash
npm run build && node fix-deployment.js
```

## Critical for humspizza.com Domain

**IMPORTANT**: When deploying to humspizza.com, you MUST run the deployment fix to ensure blog post URLs work correctly. Without this fix:
- Direct blog post URLs will redirect to homepage
- URL sharing will not work properly
- SPA routing will fail in production

## What the Fix Does

The `fix-deployment.js` script:
1. Checks if `dist/public` directory exists
2. Moves all files from `dist/public/` to `dist/`
3. Removes the empty `dist/public/` directory
4. Ensures `index.html` is at the root of the `dist/` directory as expected by deployment

## Deployment Structure

**Before Fix:**
```
dist/
├── index.js (server bundle)
└── public/
    ├── index.html
    ├── assets/
    └── other frontend files
```

**After Fix:**
```
dist/
├── index.js (server bundle)
├── index.html
├── assets/
└── other frontend files
```

## Alternative Solutions

If the above doesn't work, you can also:

1. **Change deployment public directory**: Set the deployment public directory to `dist/public` instead of `dist`
2. **Manual file management**: Manually copy files from `dist/public` to `dist` before deployment

## Notes

- The core Vite and Express configurations cannot be modified as they are protected system files
- This solution maintains compatibility with the existing development setup
- The fix script is idempotent and safe to run multiple times