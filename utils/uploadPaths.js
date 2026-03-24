const fs = require('fs');
const path = require('path');

const normalize = (value) => String(value || '').replace(/\\/g, '/');

const getUploadsRoot = () => {
  const configured = String(process.env.UPLOADS_DIR || '').trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), 'uploads');
};

const stripUploadsPrefix = (value) => {
  const normalized = normalize(value).replace(/^\/+/, '');
  return normalized.replace(/^uploads\/+/i, '');
};

const ensureUploadDir = (relativeDir) => {
  const subDir = stripUploadsPrefix(relativeDir || '');
  const root = getUploadsRoot();
  const absolute = subDir ? path.join(root, subDir) : root;
  fs.mkdirSync(absolute, { recursive: true });
  return absolute;
};

const toStoredUploadPath = (absoluteOrRelativePath) => {
  const raw = String(absoluteOrRelativePath || '').trim();
  if (!raw) return '';

  const normalized = normalize(raw);
  const root = normalize(getUploadsRoot());
  const cwd = normalize(process.cwd());

  if (normalized.startsWith(`${root}/`)) {
    return `uploads/${normalized.slice(root.length + 1).replace(/^\/+/, '')}`;
  }

  if (normalized.startsWith(`${cwd}/`)) {
    const relativeToCwd = normalized.slice(cwd.length + 1).replace(/^\/+/, '');
    if (relativeToCwd.startsWith('uploads/')) return relativeToCwd;
    return `uploads/${path.basename(relativeToCwd)}`;
  }

  if (normalized.startsWith('uploads/')) {
    return normalized;
  }

  return `uploads/${stripUploadsPrefix(normalized)}`;
};

const resolveStoredUploadAbsolutePath = (storedPath) => {
  const normalized = normalize(storedPath).trim();
  if (!normalized) return null;

  const root = getUploadsRoot();
  const subPath = stripUploadsPrefix(normalized);
  const basename = path.basename(subPath || normalized);

  const candidates = [
    path.resolve(process.cwd(), normalized),
    path.join(root, subPath),
    path.join(root, normalized),
    path.join(process.cwd(), 'uploads', subPath),
    path.join(process.cwd(), 'uploads', basename),
    path.join(root, basename),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const toUploadPublicPath = (storedPath) => {
  const subPath = stripUploadsPrefix(storedPath);
  return `/uploads/${subPath}`;
};

module.exports = {
  getUploadsRoot,
  ensureUploadDir,
  toStoredUploadPath,
  resolveStoredUploadAbsolutePath,
  toUploadPublicPath,
};
