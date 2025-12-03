import { Router } from 'express';
import { 
  createOrder, 
  getOrderById,
  cancelOrder,
  getOrderCancellation
} from '../controllers/orderController';

const router = Router();

// POST /orders - Crear un nuevo pedido
router.post('/', createOrder);

// GET /orders/:id - Obtener un pedido por su ID
router.get('/:id', getOrderById);

// POST /orders/:id/cancel - Cancelar un pedido
router.post('/:id/cancel', cancelOrder);

// GET /orders/:id/cancellation - Obtener historial de cancelación
router.get('/:id/cancellation', getOrderCancellation);

export default router;

