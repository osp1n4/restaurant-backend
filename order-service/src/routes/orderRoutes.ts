import { Router, Request, Response } from 'express';
import { orderController } from '../controllers/orderController';

const router = Router();

// POST /orders - Crear un nuevo pedido
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

