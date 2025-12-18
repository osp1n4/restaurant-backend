import { Router } from 'express';
import {
  createReview,
  getPublicReviews,
  getAllReviews,
  getReviewById,
  updateReviewStatus,
  deleteReview,
} from '../controllers/reviewController';

const router = Router();

// Rutas de administración (deben ir primero para evitar conflictos con /:id)
router.get('/admin/reviews', getAllReviews);
router.patch('/admin/:id/status', updateReviewStatus);
router.delete('/admin/:id', deleteReview);

// Rutas públicas
router.post('/', createReview);
router.get('/', getPublicReviews);
router.get('/:id', getReviewById);

export default router;
