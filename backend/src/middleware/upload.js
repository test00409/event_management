'use strict';
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const AppError = require('../utils/AppError');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'jpg,jpeg,png,pdf').split(',');
const maxSizeMB = parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = path.join(uploadDir, req.uploadSubDir || 'general');
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest(`File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

// Middleware factory: sets subDir and wraps multer
const uploadSingle = (fieldName, subDir = 'general') => (req, res, next) => {
  req.uploadSubDir = subDir;
  upload.single(fieldName)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

const getFileUrl = (req, filename, subDir = 'general') => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  return `${protocol}://${host}/uploads/${subDir}/${filename}`;
};

module.exports = { uploadSingle, getFileUrl };
