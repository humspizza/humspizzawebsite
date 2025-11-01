import fs from 'fs';
import path from 'path';

/**
 * Force read environment variable from .env file
 * This prevents issues when environment variables are not exported in production
 * 
 * @param varName - Name of the environment variable (e.g., 'NODE_ENV', 'DATABASE_URL')
 * @returns The value from .env file, or process.env, or undefined
 */
export function getEnvVar(varName: string): string | undefined {
  let value = process.env[varName];

  try {
    // Try reading from current directory first, then parent directory (for dist/)
    let envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      // If running from dist/, try parent directory
      envPath = path.resolve(process.cwd(), '..', '.env');
    }
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${varName}=(.+)$`, 'm');
      const match = envContent.match(regex);
      if (match && match[1]) {
        value = match[1].trim();
      }
    }
  } catch (error) {
    // Silently fail and use environment variable
  }

  return value;
}

/**
 * Get NODE_ENV with proper fallback
 */
export function getNodeEnv(): string {
  return getEnvVar('NODE_ENV') || 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}
