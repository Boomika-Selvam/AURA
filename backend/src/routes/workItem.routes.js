import express from 'express';
import { addComment, addWorkLog, createWorkItem, deleteWorkItem, getWorkItem, listWorkItems, moveWorkItem, toggleWatcher, updateWorkItem } from '../controllers/workItem.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listWorkItems);
router.post('/', createWorkItem);
router.get('/:id', getWorkItem);
router.put('/:id', updateWorkItem);
router.delete('/:id', deleteWorkItem);
router.patch('/:id/move', moveWorkItem);
router.post('/:id/comments', addComment);
router.post('/:id/work-logs', addWorkLog);
router.post('/:id/watch', toggleWatcher);

export default router;
