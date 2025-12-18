import { Router } from 'express';
import { createOrder, getOrderById, updateOrder, cancelOrder } from '../controllers/orderController';

const router = Router();

// POST /orders - Crear un nuevo pedido
router.post('/', createOrder);

// POST /orders/:id/cancel - Cancelar un pedido (debe ir ANTES de /:id)
router.post('/:id/cancel', cancelOrder);

// GET /orders/:id - Obtener un pedido por su ID
router.get('/:id', getOrderById);

// PUT /orders/:id - Actualizar un pedido existente
router.put('/:id', updateOrder);

export default router;

