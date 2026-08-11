import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { AppError } from '../utils/errors';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(config.upload.dir, 'images');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSize },
});
