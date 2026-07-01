import express from 'express';
import { completeSprint, createSprint, listSprints, startSprint } from '../controllers/sprint.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listSprints);
router.post('/', createSprint);
router.post('/:id/start', startSprint);
router.post('/:id/complete', completeSprint);

export default router;
