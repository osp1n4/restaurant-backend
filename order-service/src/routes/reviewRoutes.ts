import { Router } from 'express';
import { reviewController } from '../controllers/ReviewController';

/**
 * Rutas para el sistema de reseñas
 *
 * Endpoints públicos:
 * - POST /reviews - Crear reseña (cualquier usuario)
 * - GET /reviews - Listar reseñas aprobadas (público)
 * - GET /reviews/:id - Obtener reseña específica
 *
 * Endpoints admin:
 * - GET /admin/reviews - Listar todas las reseñas (incluye pending, hidden)
 * - PATCH /reviews/:id/status - Cambiar estado de reseña (aprobar/ocultar)
 */
const router = Router();

// ========== Endpoints Públicos ==========

/**
 * POST /reviews - Crear nueva reseña
 * Body: { orderId, customerName, customerEmail, ratings: { overall, food }, comment? }
 */
router.post('/', (req, res) => reviewController.createReview(req, res));

/**
 * GET /reviews - Obtener reseñas aprobadas con paginación
 * Query params: page?, limit?
 */
router.get('/', (req, res) => reviewController.getPublicReviews(req, res));

/**
 * GET /reviews/:id - Obtener una reseña específica
 */
router.get('/:id', (req, res) => reviewController.getReviewById(req, res));

// ========== Endpoints Admin ==========

/**
 * GET /admin/reviews - Obtener todas las reseñas (admin)
 * Query params: page?, limit?
 */
router.get('/admin/reviews', (req, res) => reviewController.getAllReviews(req, res));

/**
 * PATCH /reviews/:id/status - Cambiar estado de reseña (admin)
 * Body: { status: 'pending' | 'approved' | 'hidden' }
 */
router.patch('/:id/status', (req, res) => reviewController.changeReviewStatus(req, res));

export default router;
