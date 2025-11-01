import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { getNodeEnv, isProduction as isProd } from './envUtils';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force read NODE_ENV from .env file (not from environment variables)
const nodeEnv = getNodeEnv();
console.log('✅ Using NODE_ENV from .env file:', nodeEnv);

// Ensure attached_assets directory exists
// In production (server runs from dist/): use ../attached_assets
// In development (server runs from root): use ./attached_assets
const isProduction = isProd();
const attachedAssetsDir = isProduction
  ? path.join(__dirname, '..', 'attached_assets')  // dist/../attached_assets
  : path.join(process.cwd(), 'attached_assets');    // ./attached_assets

console.log('📁 Assets upload path:', attachedAssetsDir);

if (!fs.existsSync(attachedAssetsDir)) {
  fs.mkdirSync(attachedAssetsDir, { recursive: true });
  console.log('✅ Created attached_assets directory at:', attachedAssetsDir);
}

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachedAssetsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const uniqueName = `${randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for videos
const videoFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /mp4|webm|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, ogg)'));
  }
};

// Create upload middleware instances
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('image');

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
}).single('video');

// Helper to get uploaded file URL
// For Nginx + Passenger: serve from /dist/attached_assets/
export function getUploadedFileUrl(filename: string): string {
  return `/dist/attached_assets/${filename}`;
}

// Helper to delete file
export function deleteUploadedFile(filename: string): void {
  const filePath = path.join(attachedAssetsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
