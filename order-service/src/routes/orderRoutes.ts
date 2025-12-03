import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { getInternalAnalytics, postInternalAnalyticsExport } from '../controllers/analyticsController';

const router = Router();

// POST /orders - Crear un nuevo pedido
router.post('/orders', (req, res) => orderController.createOrder(req, res));

// GET /orders - Obtener todos los pedidos
router.get('/orders', (req, res) => orderController.getAllOrders(req, res));

// GET /orders/:id - Obtener un pedido por ID
router.get('/orders/:id', (req, res) => orderController.getOrderById(req, res));

// GET /orders/:id/status - Consultar estado de un pedido
router.get('/orders/:id/status', (req, res) => orderController.getOrderStatus(req, res));

// Internal analytics endpoints (not public)
router.get('/internal/analytics', getInternalAnalytics);
router.post('/internal/analytics/export', postInternalAnalyticsExport);

export default router;

