import { Router } from 'express';
import { getAdminAnalytics, postAdminAnalyticsExport } from '../controllers/analyticsController';

const router = Router();

router.get('/admin/analytics', getAdminAnalytics);
router.post('/admin/analytics/export', postAdminAnalyticsExport);

export default router;