const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (relativeDir) => {
  const target = path.join(process.cwd(), relativeDir);
  fs.mkdirSync(target, { recursive: true });
  return target;
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

