const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const cleanText = (value, maxLength = 255) => {
  return String(value ?? '').trim().slice(0, maxLength);
};

module.exports = {
  asyncHandler,
  cleanText,
};

