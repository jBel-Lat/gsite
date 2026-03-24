const multer = require('multer');
const { ensureUploadDir } = require('../utils/uploadPaths');

const ensureDir = (relativeDir) => {
  return ensureUploadDir(relativeDir);
};

const makeUploader = (relativeDir) => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, ensureDir(relativeDir));
    },
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safeName}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
};

module.exports = {
  makeUploader,
};
