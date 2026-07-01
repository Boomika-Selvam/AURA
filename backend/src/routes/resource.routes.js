import express from 'express';
import { createResource, deleteResource, getResource, listResources, markNotificationRead, updateResource } from '../controllers/resource.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const resources = '(spaces|plans|teams|goals|projects|filters|dashboards|notifications)';

router.use(requireAuth);
router.get(`/:resource${resources}`, listResources);
router.post(`/:resource${resources}`, createResource);
router.get(`/:resource${resources}/:id`, getResource);
router.put(`/:resource${resources}/:id`, updateResource);
router.delete(`/:resource${resources}/:id`, deleteResource);
router.post('/notifications/:id/read', markNotificationRead);

export default router;
