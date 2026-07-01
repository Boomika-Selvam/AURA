import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, allowed.includes(ext));
  }
});
