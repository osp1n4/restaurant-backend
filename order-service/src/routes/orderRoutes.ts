import { Router } from 'express';
import { orderController } from '../controllers/orderController';

const router = Router();

// POST /orders - Crear un nuevo pedido
router.post('/', (req, res) => orderController.createOrder(req, res));

// GET /orders/:id - Obtener un pedido por ID
router.get('/:id', (req, res) => orderController.getOrderById(req, res));

// PUT /orders/:id - Modificar un pedido existente
router.put('/:id', (req, res) => orderController.updateOrder(req, res));

// GET /orders/:id/status - Consultar estado de un pedido
router.get('/:id/status', (req, res) => orderController.getOrderStatus(req, res));

// GET /orders - Obtener todos los pedidos
router.get('/', (req, res) => orderController.getAllOrders(req, res));

// PUT /orders/:id - Actualizar un pedido (items, notas)
router.put('/:id', (req, res) => orderController.updateOrder(req, res));

// POST /orders/:id/cancel - Cancelar un pedido
router.post('/:id/cancel', (req, res) => orderController.cancelOrder(req, res));

export default router;

