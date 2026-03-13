const multer = require("multer");

// Use memory storage for cloud deployments (Railway, Heroku, etc.)
// This stores the file in memory as a Buffer instead of on disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images, videos, audio, and pdfs
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});

module.exports = upload;
