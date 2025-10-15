# Environment Variables Setup

## Overview

This application uses environment variables for configuration management. All database and application settings are stored in a `.env` file.

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the variables in `.env`:**
   - `DATABASE_URL`: PostgreSQL connection string from Neon Database
   - `SESSION_SECRET`: Secret key for session management (generate a random string)
   - `NODE_ENV`: Set to `development` or `production`
   - `PUBLIC_OBJECT_SEARCH_PATHS`: Object storage public paths (if using Replit Object Storage)
   - `PRIVATE_OBJECT_DIR`: Object storage private directory (if using Replit Object Storage)

## Required Environment Variables

### Database
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Session
```
SESSION_SECRET=your-secret-key-here
```

### Environment
```
NODE_ENV=development
```

### Object Storage (Optional)
```
PUBLIC_OBJECT_SEARCH_PATHS=your-bucket-name/public
PRIVATE_OBJECT_DIR=your-bucket-name/.private
```

## Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- `.env` is already added to `.gitignore`
- Use `.env.example` as a template (without real values)
- Generate strong random strings for `SESSION_SECRET`

## How It Works

The application loads environment variables using dotenv at startup:

```typescript
import 'dotenv/config';
```

This import at the top of `server/index.ts` ensures all environment variables are available before any other modules are loaded.

## Troubleshooting

**Issue:** Database connection fails
- **Solution:** Check that `DATABASE_URL` in `.env` is correct

**Issue:** Session errors
- **Solution:** Verify `SESSION_SECRET` is set in `.env`

**Issue:** Environment variables not loading
- **Solution:** Ensure `.env` file exists in project root
