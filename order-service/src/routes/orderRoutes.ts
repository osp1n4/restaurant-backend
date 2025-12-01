import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { getInternalAnalytics, postInternalAnalyticsExport } from '../controllers/analyticsController';

const router = Router();

// POST /orders - Crear un nuevo pedido
router.post('/', (req, res) => orderController.createOrder(req, res));

// GET /orders/:id - Obtener un pedido por ID
router.get('/:id', (req, res) => orderController.getOrderById(req, res));

// GET /orders/:id/status - Consultar estado de un pedido
router.get('/:id/status', (req, res) => orderController.getOrderStatus(req, res));

// GET /orders - Obtener todos los pedidos
router.get('/', (req, res) => orderController.getAllOrders(req, res));

// Internal analytics endpoints (not public)
router.get('/internal/analytics', getInternalAnalytics);
router.post('/internal/analytics/export', postInternalAnalyticsExport);

export default router;

