import { Router } from 'express';
import { getAnalytics, exportAnalyticsCSV, exportAnalyticsXLSX } from '../controllers/analyticsController';

const router = Router();

// GET /admin/analytics - Obtener analytics
router.get('/admin/analytics', getAnalytics);

// POST /admin/analytics/export - Exportar a CSV
router.post('/admin/analytics/export', exportAnalyticsCSV);

// POST /admin/analytics/export-xlsx - Exportar a XLSX
router.post('/admin/analytics/export-xlsx', exportAnalyticsXLSX);

export default router;
