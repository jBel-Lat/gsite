const path = require('path');
const multer = require('multer');
const { ensureUploadDir } = require('../utils/uploadPaths');

const ensureDir = (relativeDir) => {
  return ensureUploadDir(relativeDir);
};

const safeFileName = (originalName) => {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'file', ext).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}_${base}${ext}`;
};

const makeUpload = ({
  relativeDir,
  maxBytes,
  allowedMime,
  allowedExt,
}) => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ensureDir(relativeDir)),
    filename: (_req, file, cb) => cb(null, safeFileName(file.originalname)),
  });

  return multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      const mime = String(file.mimetype || '').toLowerCase();
      const ext = path.extname(file.originalname || '').toLowerCase();
      const mimeAllowed = allowedMime.includes(mime);
      const extAllowed = allowedExt.includes(ext);

      if (!mimeAllowed || !extAllowed) {
        return cb(new Error(`Invalid file type: ${mime || ext}`));
      }

      return cb(null, true);
    },
  });
};

const memberPhotoUpload = makeUpload({
  relativeDir: 'uploads/profiles',
  maxBytes: 5 * 1024 * 1024,
  allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExt: ['.jpg', '.jpeg', '.png', '.webp'],
});

const announcementImageUpload = makeUpload({
  relativeDir: 'uploads/posts',
  maxBytes: 5 * 1024 * 1024,
  allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExt: ['.jpg', '.jpeg', '.png', '.webp'],
});

const multimediaFileUpload = makeUpload({
  relativeDir: 'uploads/files',
  maxBytes: 25 * 1024 * 1024,
  allowedMime: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
  ],
  allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.txt'],
});

module.exports = {
  memberPhotoUpload,
  announcementImageUpload,
  multimediaFileUpload,
};
