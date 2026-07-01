import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', requireAuth, upload.array('files', 8), (req, res) => {
  res.status(201).json(
    req.files.map((file) => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user.id
    }))
  );
});

export default router;
