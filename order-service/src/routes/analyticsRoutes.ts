import { Router } from 'express';
import { getInternalAnalytics, postInternalAnalyticsExport } from '../controllers/analyticsController';

const router = Router();

// Rutas internas para analytics (solo accesibles desde el API Gateway)
router.get('/internal/analytics', getInternalAnalytics);
router.post('/internal/analytics/export', postInternalAnalyticsExport);

export default router;
