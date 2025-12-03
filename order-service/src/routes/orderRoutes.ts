import { Router, Request, Response } from 'express';
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
router.post('/', (req: Request, res: Response) => {
  orderController.createOrder(req, res);
});

// GET /orders - Obtener todos los pedidos
router.get('/', (req: Request, res: Response) => {
  orderController.getAllOrders(req, res);
});

// GET /orders/:id - Obtener un pedido por ID
router.get('/:id', (req: Request, res: Response) => {
  orderController.getOrderById(req, res);
});

// GET /orders/:id/status - Obtener estado del pedido
router.get('/:id/status', (req: Request, res: Response) => {
  orderController.getOrderStatus(req, res);
});

// POST /orders/:id/cancel - Cancelar un pedido
router.post('/:id/cancel', (req: Request, res: Response) => {
  orderController.cancelOrder(req, res);
});

// GET /orders/:id/cancellation - Obtener historial de cancelación
router.get('/:id/cancellation', (req: Request, res: Response) => {
  orderController.getOrderCancellation(req, res);
});

export default router;

